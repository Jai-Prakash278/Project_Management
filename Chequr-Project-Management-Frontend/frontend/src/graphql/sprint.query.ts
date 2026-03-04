import { gql } from '@apollo/client';

export const GET_SPRINTS_QUERY = gql`
  query GetSprints($projectId: String!) {
    getSprintsByProject(projectId: $projectId) {
      id
      name
      status
      startDate
      endDate
      goal
      createdAt
      updatedAt
      issues {
        id
        title
        stage {
          id
          name
          isFinal
        }
        type
        priority
        assignee {
          id
          firstName
          lastName
          avatarUrl
        }
        storyPoints
      }
    }
  }
`;