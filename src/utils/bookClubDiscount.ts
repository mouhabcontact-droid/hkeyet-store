export const BOOK_CLUB_DISCOUNT_PERCENTAGE = 30;

export function applyBookClubDiscount(price: number, userRole?: string): number {
  if (userRole === 'book_club') {
    const discount = (price * BOOK_CLUB_DISCOUNT_PERCENTAGE) / 100;
    return price - discount;
  }
  return price;
}

export function getBookClubDiscountAmount(price: number): number {
  return (price * BOOK_CLUB_DISCOUNT_PERCENTAGE) / 100;
}

export function isBookClubMember(userRole?: string): boolean {
  return userRole === 'book_club';
}
