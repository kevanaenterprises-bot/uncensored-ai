// types/next-auth.d.ts

import 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    isAdmin: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      isAdmin: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
  }
}
