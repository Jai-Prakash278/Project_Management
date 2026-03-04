import { gql } from '@apollo/client';

export const CREATE_SPRINT_MUTATION = gql`
  mutation CreateSprint($input: createSprintInput!) {
    createSprint(input: $input) {
      id
      name
      startDate
      endDate
      status
    }
  }
`;

export const UPDATE_SPRINT_MUTATION = gql`
  mutation UpdateSprint($input: updateSprintInput!) {
    updateSprint(input: $input) {
      id
      name
      startDate
      endDate
      status
    }
  }
`;

export const START_SPRINT_MUTATION = gql`
  mutation StartSprint($input: startSprintInput!) {
    startSprint(input: $input) {
      id
      status
    }
  }
`;

export const COMPLETE_SPRINT_MUTATION = gql`
  mutation CompleteSprint($sprintId: String!) {
    completeSprint(sprintId: $sprintId) {
      id
      status
    }
  }
`;

export const DELETE_SPRINT_MUTATION = gql`
  mutation DeleteSprint($sprintId: String!) {
    deleteSprint(sprintId: $sprintId)
  }
`;
