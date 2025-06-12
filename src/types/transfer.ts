
export type TransferData = {
  recipient: {
    fullName: string;
    email: string;
    country: string;
    phone: string;
  };
  transfer: {
    amount: number;
    currency: string;
  };
};

export const INITIAL_TRANSFER_DATA: TransferData = {
  recipient: {
    fullName: "",
    email: "",
    country: "", // Empty by default to force country selection
    phone: "",
  },
  transfer: {
    amount: 0,
    currency: "XAF",
  },
};
