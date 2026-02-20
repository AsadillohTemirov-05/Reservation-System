/**
 * 1000 Concurrent Seat Reservation Test
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3000';
const CONCURRENT_REQUESTS = 1000;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

async function getSeatIdByNumber(seatNumber) {
  try {
    const response = await axios.get(`${API_URL}/api/seats`);
    
    if (!response.data || !response.data.data) {
      console.log(`${colors.red}Invalid seats response:${colors.reset}`, response.data);
      return null;
    }

    const seat = response.data.data.find(s => s.seatNumber === seatNumber);
    return seat ? seat.id : null;
  } catch (error) {
    console.error(`${colors.red}Failed to get seat:${colors.reset}`, error.message);
    if (error.response) {
      console.log('Response status:', error.response.status);
      console.log('Response data:', error.response.data);
    }
    return null;
  }
}

async function testSingleRequest(seatId) {
  console.log(`\n${colors.yellow}🔍 Testing single request first...${colors.reset}`);
  
  try {
    const response = await axios.post(
      `${API_URL}/api/seats/reserve`,
      {
        seatId: seatId,
        userId: 'test-user-single',
      },
      {
        headers: {
          'Idempotency-Key': uuidv4(),
        },
        validateStatus: () => true,
        timeout: 10000, // ✅ 10s yetarli single request uchun
      }
    );

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(response.data, null, 2));
    
    if (response.status === 201) {
      console.log(`${colors.green}✅ Single request successful!${colors.reset}\n`);
      return true;
    } else {
      console.log(`${colors.red}❌ Single request failed!${colors.reset}`);
      console.log(`Expected 201, got ${response.status}\n`);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Single request error:${colors.reset}`, error.message);
    return false;
  }
}

async function reserveSeat(userId, seatId, idempotencyKey, resultIndex) {
  try {
    const response = await axios.post(
      `${API_URL}/api/seats/reserve`,
      {
        seatId: seatId,
        userId: userId,
      },
      {
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
        validateStatus: () => true,
        timeout: 120000, // ✅ 120s (2 min) - 1000 concurrent uchun
      }
    );

    // ✅ DEBUG: Birinchi 5 ta error log (3 → 5)
    if (response.status !== 201 && response.status !== 409 && resultIndex < 5) {
      console.log(`\n${colors.yellow}[Request ${resultIndex}] Error:${colors.reset}`);
      console.log(`  Status: ${response.status}`);
      console.log(`  Response:`, response.data);
    }

    return {
      success: response.status === 201,
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    // ✅ DEBUG: Network errors
    if (resultIndex < 5) {
      console.log(`\n${colors.red}[Request ${resultIndex}] Network error:${colors.reset}`, error.message);
      if (error.code) {
        console.log(`  Error code: ${error.code}`);
      }
    }
    
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.message,
      code: error.code,
    };
  }
}

async function clearReservations() {
  console.log(`${colors.yellow}🧹 Clearing old reservations...${colors.reset}`);
  
  try {
    const response = await axios.get(`${API_URL}/api/reservations?status=PENDING`);
    const reservations = response.data.data || [];

    for (const reservation of reservations) {
      try {
        await axios.delete(`${API_URL}/api/reservations/cancel`, {
          data: {
            reservationId: reservation.id,
            userId: reservation.userId,
          },
        });
      } catch (err) {
        // Ignore
      }
    }

    console.log(`${colors.green}✅ Cleared ${reservations.length} reservations${colors.reset}`);
    
    // ✅ Wait for seats to be released
    if (reservations.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Could not clear reservations: ${error.message}${colors.reset}`);
  }
}

async function runConcurrencyTest() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🚀 1000 CONCURRENT SEAT RESERVATION TEST${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  // Step 1: Get seat ID
  console.log(`${colors.blue}📍 Target: Seat A5${colors.reset}`);
  const seatId = await getSeatIdByNumber('A5');
  
  if (!seatId) {
    console.error(`${colors.red}❌ Seat A5 not found! Run seeders first: npm run seed${colors.reset}`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ Seat ID: ${seatId}${colors.reset}`);

  // Step 2: Clear old reservations
  await clearReservations();

  // Step 3: Test single request first
  const singleSuccess = await testSingleRequest(seatId);
  if (!singleSuccess) {
    console.error(`${colors.red}❌ Single request failed - fix backend first!${colors.reset}`);
    process.exit(1);
  }

  // Clear again after single test
  await clearReservations();

  // Step 4: Prepare requests
  console.log(`${colors.blue}📦 Preparing ${CONCURRENT_REQUESTS} concurrent requests...${colors.reset}`);
  
  const requests = [];
  for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
    const userId = `user-${i + 1}`;
    const idempotencyKey = uuidv4();
    requests.push(() => reserveSeat(userId, seatId, idempotencyKey, i));
  }

  console.log(`${colors.green}✅ Requests ready${colors.reset}\n`);

  // Step 5: Execute all requests concurrently
  console.log(`${colors.yellow}⚡ Launching ${CONCURRENT_REQUESTS} concurrent requests...${colors.reset}`);
  const startTime = Date.now();

  const results = await Promise.all(requests.map(fn => fn()));

  const duration = Date.now() - startTime;

  // Step 6: Analyze results
  console.log(`\n${colors.green}✅ All requests completed in ${duration}ms${colors.reset}\n`);

  const successful = results.filter(r => r.success);
  const conflicts = results.filter(r => r.status === 409);
  const errors = results.filter(r => r.status >= 500);
  const badRequest = results.filter(r => r.status >= 400 && r.status < 500 && r.status !== 409);
  const timeouts = results.filter(r => r.code === 'ECONNABORTED' || r.status === 408);

  // Step 7: Display results
  console.log('='.repeat(70));
  console.log(`${colors.cyan}📊 RESULTS${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`${colors.green}✅ Successful (201):${colors.reset}      ${successful.length}`);
  console.log(`${colors.yellow}⚠️  Conflicts (409):${colors.reset}       ${conflicts.length}`);
  console.log(`${colors.red}❌ Server Errors (5xx):${colors.reset}  ${errors.length}`);
  console.log(`${colors.blue}⚠️  Bad Request (4xx):${colors.reset}   ${badRequest.length}`);
  console.log(`${colors.red}⏱️  Timeouts:${colors.reset}            ${timeouts.length}`);
  console.log(`${colors.cyan}⏱️  Duration:${colors.reset}            ${duration}ms`);
  console.log(`${colors.cyan}⚡ Avg Response Time:${colors.reset}   ${(duration / CONCURRENT_REQUESTS).toFixed(2)}ms`);
  console.log('='.repeat(70) + '\n');

  // ✅ DEBUG: Error breakdown
  if (errors.length > 0 || badRequest.length > 0 || timeouts.length > 0) {
    console.log(`${colors.yellow}🔍 ERROR BREAKDOWN:${colors.reset}`);
    const statusCounts = {};
    results.forEach(r => {
      if (!r.success) {
        const key = r.code || r.status;
        statusCounts[key] = (statusCounts[key] || 0) + 1;
      }
    });
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count} requests`);
    });
    console.log('');
  }

  // Step 8: Validate
  console.log(`${colors.cyan}🔍 VALIDATION${colors.reset}`);
  console.log('='.repeat(70));

  const passed = [];
  const failed = [];

  if (successful.length === 1) {
    passed.push('✅ Exactly 1 successful reservation');
  } else {
    failed.push(`❌ Expected 1 successful, got ${successful.length}`);
  }

  if (conflicts.length >= CONCURRENT_REQUESTS - 10) {
    passed.push(`✅ ${conflicts.length} requests got 409 Conflict`);
  } else {
    failed.push(`❌ Only ${conflicts.length} got 409, expected ~${CONCURRENT_REQUESTS - 1}`);
  }

  if (errors.length === 0) {
    passed.push('✅ No server errors (5xx)');
  } else {
    failed.push(`❌ ${errors.length} server errors`);
  }

  if (timeouts.length === 0) {
    passed.push('✅ No timeouts');
  } else {
    failed.push(`❌ ${timeouts.length} requests timed out`);
  }

  if (results.length === CONCURRENT_REQUESTS) {
    passed.push('✅ No deadlocks - all requests completed');
  } else {
    failed.push(`❌ Only ${results.length}/${CONCURRENT_REQUESTS} completed`);
  }

  passed.forEach(msg => console.log(`${colors.green}${msg}${colors.reset}`));
  failed.forEach(msg => console.log(`${colors.red}${msg}${colors.reset}`));

  console.log('='.repeat(70) + '\n');

  if (failed.length === 0) {
    console.log(`${colors.green}🎉 TEST PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ TEST FAILED!${colors.reset}\n`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});

runConcurrencyTest().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});