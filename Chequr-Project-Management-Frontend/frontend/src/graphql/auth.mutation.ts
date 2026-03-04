import { gql } from '@apollo/client';

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      message
      user {
        id
        email
        roles
      }
    }
  }
`;

export const REFRESH_TOKEN_MUTATION = gql`
  mutation RefreshToken {
    refreshToken {
      message
      user {
        id
        email
        roles
      }
    }
  }
`;

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`;

export const SEND_INVITATION_MUTATION = gql`
  mutation InviteUser($input: InviteUserInput!) {
    inviteUser(input: $input)
  }
`;

export const SEND_BULK_INVITES_MUTATION = gql`
  mutation SendBulkInvites($users: [BulkInviteInput!]!) {
    sendBulkInvites(users: $users)
  }
`;

export const COMPLETE_REGISTRATION_MUTATION = gql`
  mutation CompleteRegistration($input: CompleteRegistrationInput!) {
    completeRegistration(input: $input)
  }
`;

export const FORGOT_PASSWORD_MUTATION = gql`
  mutation ForgotPassword($email: String!) {
  forgotPassword(email: $email)
}
`;

export const VERIFY_RESET_OTP_MUTATION = gql`
  mutation VerifyResetOtp($email: String!, $otp: String!) {
  verifyResetOtp(email: $email, otp: $otp)
}
`;

export const RESET_PASSWORD_MUTATION = gql`
  mutation ResetPassword($email: String!, $newPassword: String!) {
  resetPassword(email: $email, newPassword: $newPassword)
}
`;

// export const DELETE_USER_MUTATION = gql`
//   mutation DeleteUser($email: String!) {
//   deleteUser(email: $email)
// }
// `;

export const UPDATE_PROFILE_MUTATION = gql`
  mutation UpdateProfile($input: UpdateUserInput!) {
  updateProfile(input: $input) {
    id
    firstName
    lastName
    phone
    reportingManager
  }
}
`;

export const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUserById(id: $id, input: $input) {
    id
    firstName
    lastName
    phone
    reportingManager
  }
}
`;

export const DELETE_USER_MUTATION = gql`
  mutation DeleteUser($email: String!) {
    deleteUser(email: $email)
  }
`;

// export const UPDATE_PROFILE_MUTATION = gql`
//   mutation UpdateProfile($input: UpdateUserInput!) {
//     updateProfile(input: $input) {
//       id
//       firstName
//       lastName
//       phone
//       email
//     }
//   }
// `;
