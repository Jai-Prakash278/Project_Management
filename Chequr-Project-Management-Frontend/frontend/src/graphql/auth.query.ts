import { gql } from '@apollo/client';

export const GET_INVITE_DATA_QUERY = gql`
  query GetInviteData($token: String!) {
    getInviteData(token: $token) {
      id
      email
      firstName
      lastName
    }
  }
`;

export const HEALTH_QUERY = gql`
  query {
    health
  }
`;

export const USER_BY_EMAIL_QUERY = gql`
  query UserByEmail($email: String!) {
    userByEmail(email: $email) {
      id
      email
      firstName
      lastName
      roleKeys
      status
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
      employeeId
      roleKeys
      phone
      reportingManager
    }
  }
`;

export const GET_MY_PROFILE_QUERY = gql`
  query Me {
    me {
      id
      email
      roles
    }
  }
`;

export const GET_USER_DETAILS_QUERY = gql`
  query UserDetails($id: ID!) {
    user(id: $id) {
      id
      firstName
      lastName
      phone
      organizationId
    }
  }
`;

export const GET_ORGANIZATION_TEAM_QUERY = gql`
  query OrganizationTeam($orgId: ID!) {
  organizationTeam(orgId: $orgId) {
    id
    name
    firstName
    lastName
    email
    roles
    status
    phone
    employeeId
    reportingManager
  }
}
`;
