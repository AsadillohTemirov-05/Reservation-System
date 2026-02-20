export class DateUtil {

  static addMinutes(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  static addSeconds(seconds: number): Date {
    return new Date(Date.now() + seconds * 1000);
  }


  static isExpired(date: Date): boolean {
    return new Date() > new Date(date);
  }

  static getRemainingSeconds(date: Date): number {
    return Math.floor((new Date(date).getTime() - Date.now()) / 1000);
  }


  static getRemainingMs(date: Date): number {
    return new Date(date).getTime() - Date.now();
  }


  static toISOString(date: Date): string {
    return new Date(date).toISOString();
  }


  static getReservationExpiryDate(minutes: number = 2): Date {
    return DateUtil.addMinutes(minutes);
  }
}