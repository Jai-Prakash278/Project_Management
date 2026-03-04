import { gql } from '@apollo/client';

export const GET_BOARD_ISSUES_QUERY = gql`
  query GetBoardIssues($projectId: String!, $sprintId: String) {
    getBoardIssues(projectId: $projectId, sprintId: $sprintId) {
      id
      name
      orderIndex
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
        description
        assignee {
          id
          firstName
          lastName
          username
          avatarUrl
        }
        reporter {
          id
          firstName
          lastName
          username
          avatarUrl
        }
        project {
          id
          name
        }
        sprint {
          id
          name
          status
        }
        parent {
          id
          title
        }
        subtaskList {
          id
          title
          completed
        }
        storyPoints
        dueDate
        blockedReason
        createdAt
        updatedAt
      }
    }
  }
`;

export const GET_MY_ASSIGNED_ISSUES_QUERY = gql`
  query GetMyAssignedIssues {
    myAssignedIssues {
      id
      title
      stage {
        id
        name
        isFinal
      }
      type
      priority
      project {
        id
        name
      }
      sprint {
        id
        name
        status
      }
      assignee {
        id
        firstName
        lastName
        avatarUrl
      }
      createdAt
    }
  }
`;

export const GET_MY_ISSUES_QUERY = gql`
  query GetMyIssues($filter: String) {
    getMyIssues(filter: $filter) {
      id
      title
      stage {
        id
        name
        isFinal
        orderIndex
      }
      type
      priority
      project {
        id
        name
        key
        workflow {
          id
          transitionMode
          stages {
            id
            name
            orderIndex
            isFinal
          }
        }
      }
      sprint {
        id
        name
        status
      }
      assignee {
        id
        firstName
        lastName
        username
        avatarUrl
      }
      reporter {
        id
        firstName
        lastName
        username
        avatarUrl
      }
      updatedAt
      createdAt
      description
      dueDate
      blockedReason
      storyPoints
      subtaskList {
        id
        title
        completed
      }
    }
  }
`;


export const GET_BACKLOG_ISSUES_QUERY = gql`
  query GetBacklogIssues($projectId: ID!) {
    getIssuesByProject(projectId: $projectId) {
      id
      title
      stage {
        id
        name
        isFinal
      }
      type
      priority
      # storyPoints
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
        avatarUrl
      }
      sprint {
        id
        name
      }
      createdAt
    }
  }
`;


export const GET_ISSUE_BY_ID_QUERY = gql`
query GetIssueById($id: ID!) {
  getIssueById(id: $id) {
    id
    title
    description
    blockedReason
    stage {
      id
      name
      isFinal
    }
    priority
    type
    project {
      id
      name
      key
      workflow {
        id
        transitionMode
        stages {
          id
          name
          orderIndex
          isFinal
        }
      }
    }
    reporter {
      id
      firstName
      lastName
      avatarUrl
    }
    assignee {
      id
      firstName
      lastName
      username
      avatarUrl
    }
    subtaskList {
        id
        title
        completed
    }
    storyPoints
    dueDate
    createdAt
    updatedAt
  }
}
`;

export const GET_ISSUES_BY_PROJECT = gql`
query GetIssuesByProject($projectId: ID!) {
  getIssuesByProject(projectId: $projectId) {
    id
    title
    stage {
      id
      name
      isFinal
    }
    priority
    type
    assignee {
      id
      firstName
    }
    storyPoints
    dueDate
    reporter {
        id
        firstName
    }
  }
}
`;

export const GET_COMMENTS_BY_ISSUE_QUERY = gql`
  query GetCommentsByIssue($issueId: String!) {
    commentsByIssue(issueId: $issueId) {
      id
      content
      createdAt
      updatedAt
      isEdited
      author {
        id
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

export const GET_ATTACHMENTS_BY_ISSUE_QUERY = gql`
  query GetAttachmentsByIssue($issueId: String!) {
    attachmentsByIssue(issueId: $issueId) {
      id
      fileName
      mimeType
      fileSize
      base64
      createdAt
      uploadedBy {
        id
        firstName
        lastName
      }
    }
  }
`;

export const DOWNLOAD_ATTACHMENT_QUERY = gql`
  query DownloadAttachment($id: ID!) {
    downloadAttachment(id: $id) {
      fileName
      mimeType
      base64
    }
  }
`;
