import { gql } from '@apollo/client';

export const GET_USER_PROFILE = gql`
  query GetUserProfile($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      email
      phone
      status
      avatarUrl
      employmentType
      employmentStatus
      organizationId
      createdAt
    }
  }
`;

export const GET_ORGANIZATION_TEAM_QUERY = gql`
  query GetOrganizationTeam($orgId: ID!) {
    organizationTeam(orgId: $orgId) {
      id
      email
      firstName
      lastName
      status
      roles
      reportingManager
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateUserInput!) {
    updateProfile(input: $input) {
      id
      firstName
      lastName
      phone
    }
  }
`;

export const GET_ALL_USERS_QUERY = gql`
  query GetAllUsers {
    users {
      id
      email
      firstName
      lastName
      status
      avatarUrl
      roleKeys
    }
  }
`;
