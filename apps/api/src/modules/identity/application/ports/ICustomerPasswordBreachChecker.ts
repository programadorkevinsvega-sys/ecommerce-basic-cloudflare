export interface ICustomerPasswordBreachChecker {
  isCompromised(password: string): Promise<boolean>;
}
