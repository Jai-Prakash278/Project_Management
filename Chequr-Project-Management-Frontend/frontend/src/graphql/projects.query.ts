import { gql } from '@apollo/client';

export const GET_PROJECTS_QUERY = gql`
  query GetProjects {
    projects {
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
        email
      }
      members {
        id
        firstName
        lastName
        avatarUrl
      }
      workflow {
        id
        name
        isDefault
        transitionMode
        stages {
          id
          name
          orderIndex
          isFinal
        }
      }
      issues {
        id
        title
        type
        priority
        dueDate
        stage {
          id
          name
          isFinal
        }
        assignee {
          id
          firstName
          lastName
          avatarUrl
        }
        reporter {
          id
          firstName
          lastName
        }
        sprint {
          id
          name
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const CHECK_PROJECT_KEY_QUERY = gql`
  query CheckProjectKey($key: String!) {
    isProjectKeyAvailable(key: $key)
  }
`;

export const GET_PROJECT_QUERY = gql`
  query GetProject($id: String!) {
    project(id: $id) {
      id
      name
      key
      description
      status
      owner {
        id
        firstName
        lastName
        email
      }
      members {
        id
        firstName
        lastName
        avatarUrl
      }
      workflow {
        id
        name
        isDefault
        transitionMode
        stages {
          id
          name
          orderIndex
          isFinal
        }
      }
      issues {
        id
        stage {
          id
          isFinal
        }
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_PROJECT_MUTATION = gql`
  mutation CreateProject($createProjectInput: CreateProjectInput!) {
    createProject(createProjectInput: $createProjectInput) {
      id
      name
      key
      description
      color
      status
      owner {
        id
        firstName
        lastName
      }
      members {
        id
        firstName
        lastName
      }
    }
  }
`;

export const IS_PROJECT_KEY_AVAILABLE_QUERY = gql`
  query IsProjectKeyAvailable($key: String!) {
    isProjectKeyAvailable(key: $key)
  }
`;

export const GET_WORKFLOW_TRANSITIONS_QUERY = gql`
  query GetWorkflowTransitions($workflowId: String!) {
    getWorkflowTransitions(workflowId: $workflowId) {
      fromStage {
        id
        name
      }
      toStage {
        id
        name
      }
      allowedRoles
    }
  }
`;
