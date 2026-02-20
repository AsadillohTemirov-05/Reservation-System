/**
 * Stress Test - Multiple seats, sequential waves
 * 
 * Scenario:
 * - 10 ta seat (A1-A10)
 * - Har bir seat uchun 100 concurrent request
 * - Total: 1000 requests
 */

const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const API_URL = 'http://localhost:3000';
const SEATS_TO_TEST = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'];
const REQUESTS_PER_SEAT = 100;

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

async function getSeatIdByNumber(seatNumber) {
  try {
    const response = await axios.get(`${API_URL}/api/seats`);
    
    if (!response.data || !response.data.data) {
      console.error(`${colors.red}Invalid seats response${colors.reset}`);
      return null;
    }

    const seat = response.data.data.find(s => s.seatNumber === seatNumber);
    return seat ? seat.id : null;
  } catch (error) {
    console.error(`${colors.red}Failed to get seats:${colors.reset}`, error.message);
    return null;
  }
}

async function reserveSeat(userId, seatId) {
  try {
    const response = await axios.post(
      `${API_URL}/api/seats/reserve`,
      { seatId, userId },
      {
        headers: { 'Idempotency-Key': uuidv4() },
        validateStatus: () => true,
        timeout: 60000, // ✅ 60s timeout
      }
    );
    return { 
      success: response.status === 201, 
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return { 
      success: false, 
      status: error.response?.status || 500,
      error: error.message,
    };
  }
}

async function clearReservation(seatNumber, seatId) {
  try {
    // Get all PENDING reservations for this seat
    const response = await axios.get(`${API_URL}/api/reservations?status=PENDING`);
    const reservations = response.data.data || [];
    
    const seatReservation = reservations.find(r => r.seatId === seatId);
    
    if (seatReservation) {
      await axios.delete(`${API_URL}/api/reservations/cancel`, {
        data: {
          reservationId: seatReservation.id,
          userId: seatReservation.userId,
        },
      });
      console.log(`${colors.yellow}  🧹 Cleared reservation for ${seatNumber}${colors.reset}`);
    }
  } catch (error) {
    // Ignore errors
  }
}

async function testSeat(seatNumber, seatId) {
  const requests = Array.from({ length: REQUESTS_PER_SEAT }, (_, i) =>
    () => reserveSeat(`user-${seatNumber}-${i}`, seatId)
  );

  const startTime = Date.now();
  const results = await Promise.all(requests.map(fn => fn()));
  const duration = Date.now() - startTime;

  const successful = results.filter(r => r.success).length;
  const conflicts = results.filter(r => r.status === 409).length;
  const errors = results.filter(r => r.status >= 500).length;
  const badRequest = results.filter(r => r.status >= 400 && r.status < 500 && r.status !== 409).length;

  return { 
    seatNumber, 
    successful, 
    conflicts, 
    errors,
    badRequest,
    duration, 
    total: REQUESTS_PER_SEAT 
  };
}

async function runStressTest() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🔥 STRESS TEST - ${SEATS_TO_TEST.length} Seats x ${REQUESTS_PER_SEAT} Requests${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  const allResults = [];
  let totalDuration = 0;

  for (const seatNumber of SEATS_TO_TEST) {
    const seatId = await getSeatIdByNumber(seatNumber);
    
    if (!seatId) {
      console.log(`${colors.red}❌ Seat ${seatNumber} not found${colors.reset}`);
      continue;
    }

    // Clear any existing reservation first
    await clearReservation(seatNumber, seatId);

    console.log(`${colors.yellow}⚡ Testing ${seatNumber}...${colors.reset}`);
    const result = await testSeat(seatNumber, seatId);
    allResults.push(result);
    totalDuration += result.duration;

    // Determine status color
    let status;
    if (result.successful === 1 && result.errors === 0) {
      status = colors.green;
    } else if (result.successful === 1 && result.errors > 0) {
      status = colors.yellow;
    } else {
      status = colors.red;
    }

    console.log(`${status}   ✓ ${result.seatNumber}: ${result.successful} success, ${result.conflicts} conflicts, ${result.errors} errors, ${result.duration}ms${colors.reset}`);
    
    // ✅ Wait a bit between seats to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 SUMMARY${colors.reset}`);
  console.log('='.repeat(70));

  const totalSuccess = allResults.reduce((sum, r) => sum + r.successful, 0);
  const totalConflicts = allResults.reduce((sum, r) => sum + r.conflicts, 0);
  const totalErrors = allResults.reduce((sum, r) => sum + r.errors, 0);
  const totalBadRequest = allResults.reduce((sum, r) => sum + r.badRequest, 0);
  const totalRequests = SEATS_TO_TEST.length * REQUESTS_PER_SEAT;

  console.log(`Total Requests:       ${totalRequests}`);
  console.log(`${colors.green}Successful (201):${colors.reset}     ${totalSuccess}`);
  console.log(`${colors.yellow}Conflicts (409):${colors.reset}      ${totalConflicts}`);
  console.log(`${colors.red}Server Errors (5xx):${colors.reset}  ${totalErrors}`);
  console.log(`${colors.blue}Bad Request (4xx):${colors.reset}    ${totalBadRequest}`);
  console.log(`Total Duration:       ${totalDuration}ms`);
  console.log(`Avg per seat:         ${(totalDuration / SEATS_TO_TEST.length).toFixed(0)}ms`);
  console.log('='.repeat(70) + '\n');

  // Validation
  console.log(`${colors.cyan}🔍 VALIDATION${colors.reset}`);
  console.log('='.repeat(70));

  const passed = [];
  const failed = [];

  // Test 1: All seats should have exactly 1 success
  if (totalSuccess === SEATS_TO_TEST.length) {
    passed.push(`✅ All ${SEATS_TO_TEST.length} seats reserved exactly once`);
  } else {
    failed.push(`❌ Expected ${SEATS_TO_TEST.length} successful, got ${totalSuccess}`);
  }

  // Test 2: Most requests should be conflicts
  const expectedConflicts = totalRequests - SEATS_TO_TEST.length;
  if (totalConflicts >= expectedConflicts - 20) {
    passed.push(`✅ ${totalConflicts} conflicts (expected ~${expectedConflicts})`);
  } else {
    failed.push(`❌ Only ${totalConflicts} conflicts, expected ~${expectedConflicts}`);
  }

  // Test 3: No server errors
  if (totalErrors === 0) {
    passed.push('✅ No server errors (5xx)');
  } else {
    failed.push(`❌ ${totalErrors} server errors`);
  }

  passed.forEach(msg => console.log(`${colors.green}${msg}${colors.reset}`));
  failed.forEach(msg => console.log(`${colors.red}${msg}${colors.reset}`));

  console.log('='.repeat(70) + '\n');

  if (failed.length === 0) {
    console.log(`${colors.green}🎉 STRESS TEST PASSED!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ STRESS TEST FAILED!${colors.reset}\n`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (error) => {
  console.error(`${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});

runStressTest().catch(error => {
  console.error(`${colors.red}Test failed:${colors.reset}`, error);
  process.exit(1);
});