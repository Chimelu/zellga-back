export type UserRole = "seller" | "affiliate";

/** Bank details a payout (seller earnings or affiliate commission) is sent to. */
export type PayoutAccount = {
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
};

export type UserProps = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  passwordHash: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  readonly id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  passwordHash: string;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.phone = props.phone;
    this.email = props.email;
    this.role = props.role;
    this.passwordHash = props.passwordHash;
    this.bankName = props.bankName;
    this.bankAccountNumber = props.bankAccountNumber;
    this.bankAccountName = props.bankAccountName;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  /** True once the account can actually receive money. */
  get hasPayoutAccount(): boolean {
    return Boolean(
      this.bankName && this.bankAccountNumber && this.bankAccountName
    );
  }
}
