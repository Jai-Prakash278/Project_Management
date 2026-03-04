import { gql } from '@apollo/client';

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($createProjectInput: CreateProjectInput!) {
    createProject(createProjectInput: $createProjectInput) {
      id
      name
      key
      description
      status
      color
      icon
      type
      owner {
        id
        firstName
        lastName
      }
      workflow {
        id
        name
        transitionMode
        stages {
          id
          name
          orderIndex
        }
      }
      createdAt
    }
  }
`;

export const UPDATE_PROJECT_MUTATION = gql`
  mutation UpdateProject($updateProjectInput: UpdateProjectInput!) {
    updateProject(updateProjectInput: $updateProjectInput) {
      id
      name
      description
      status
      updatedAt
    }
  }
`;

export const ARCHIVE_PROJECT_MUTATION = gql`
  mutation ArchiveProject($id: String!) {
    archiveProject(id: $id) {
      id
      status
    }
  }
`;

export const UNARCHIVE_PROJECT_MUTATION = gql`
  mutation UnarchiveProject($id: String!) {
    unarchiveProject(id: $id) {
      id
      status
    }
  }
`;

export const DELETE_PROJECT_MUTATION = gql`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`;

export const ASSIGN_USERS_TO_PROJECT_MUTATION = gql`
  mutation AssignUsersToProject($assignUsersInput: AssignUsersInput!) {
    assignUsersToProject(assignUsersInput: $assignUsersInput) {
      id
      members {
        id
        firstName
        lastName
      }
    }
  }
`;

export const CREATE_WORKFLOW_ADVANCED_MUTATION = gql`
  mutation CreateWorkflowAdvanced($input: CreateWorkflowAdvancedInput!) {
    createWorkflowAdvanced(input: $input) {
      id
      name
      transitionMode
      stages {
        id
        name
        orderIndex
      }
    }
  }
`;
