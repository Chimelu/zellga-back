export type UserProps = {
  id: string;
  name: string;
  phone: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  readonly id: string;
  name: string;
  phone: string;
  passwordHash: string;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: UserProps) {
    this.id = props.id;
    this.name = props.name;
    this.phone = props.phone;
    this.passwordHash = props.passwordHash;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
