export type BusinessProfileDto = {
  user: {
    id: string;
    name: string;
    phone: string;
  };
  store: {
    id: string;
    name: string;
    slug: string;
    category: string | null;
    description: string | null;
    link: string;
  };
  settings: {
    /** Default checkout path for new items */
    defaultCheckoutMode: "whatsapp" | "platform";
  };
};

export type UpdateStoreDetailsDto = {
  name?: string;
  slug?: string;
  category?: string | null;
  description?: string | null;
};

export type UpdateAccountDto = {
  name?: string;
  phone?: string;
};

export type UpdateSettingsDto = {
  defaultCheckoutMode?: "whatsapp" | "platform";
};

export type ChangePasswordDto = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
