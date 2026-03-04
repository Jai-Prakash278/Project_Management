import { gql } from '@apollo/client';



export const MOVE_ISSUE_MUTATION = gql`
  mutation MoveIssue($input: MoveIssueInput!) {
    moveIssue(input: $input) {
      id
      title
      stage {
        id
        name
        isFinal
      }
      boardOrder
      dueDate

      sprint {
        id
        name
        status
      }
      updatedAt
    }
  }
`;

export const CREATE_ISSUE_MUTATION = gql`
 mutation CreateIssue($input: CreateIssueInput!) {
  createIssue(input: $input) {
    id
    title
    description
    stage {
      id
      name
      isFinal
    }
    priority
    type

    sprint {
      id
      name
      status
    }
    reporter {
      id
      firstName
    }
    assignee {
      id
      firstName
    }
    storyPoints
    dueDate
  }
}
`;

export const UPDATE_ISSUE_MUTATION = gql`
 mutation UpdateIssue($input: UpdateIssueInput!) {
  updateIssue(input: $input) {
    id
    title
    description
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
    blockedReason

    sprint {
      id
      name
      status
    }
  }
}
`;

export const ASSIGN_ISSUE_MUTATION = gql`
 mutation AssignIssue($input: AssignIssueInput!) {
  assignIssue(input: $input) {
    id
    assignee {
      id
      firstName
      email
    }
  }
}
`;

export const DELETE_ISSUE_MUTATION = gql`
 mutation DeleteIssue($id: ID!) {
  deleteIssue(id: $id)
}
`;

export const ADD_SUBTASK_MUTATION = gql`
    mutation AddSubtask($issueId: ID!, $title: String!) {
        addSubtask(issueId: $issueId, title: $title) {
            id
            title
            completed
        }
    }
`;

export const TOGGLE_SUBTASK_MUTATION = gql`
    mutation ToggleSubtask($subtaskId: ID!) {
        toggleSubtask(subtaskId: $subtaskId) {
            id
            title
            completed
        }
    }
`;

export const DELETE_SUBTASK_MUTATION = gql`
    mutation DeleteSubtask($subtaskId: ID!) {
        deleteSubtask(subtaskId: $subtaskId)
    }
`;

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($input: CreateCommentInput!) {
    createComment(createCommentInput: $input) {
      id
      content
      createdAt
      author {
        id
        firstName
        lastName
        avatarUrl
      }
    }
  }
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DeleteComment($id: ID!) {
    deleteComment(id: $id)
  }
`;

export const UPLOAD_ATTACHMENT_MUTATION = gql`
  mutation UploadAttachment($issueId: String!, $file: Upload!) {
    uploadAttachment(issueId: $issueId, file: $file) {
      id
      fileName
      mimeType
      createdAt
      uploadedBy {
        id
        firstName
        lastName
      }
    }
  }
`;

export const DELETE_ATTACHMENT_MUTATION = gql`
  mutation DeleteAttachment($id: ID!) {
    deleteAttachment(id: $id)
  }
`;

export const UPDATE_COMMENT_MUTATION = gql`
  mutation UpdateComment($input: UpdateCommentInput!) {
    updateComment(updateCommentInput: $input) {
      id
      content
      updatedAt
      isEdited
    }
  }
`;

export const UPDATE_ATTACHMENT_MUTATION = gql`
  mutation UpdateAttachment($id: ID!, $fileName: String!) {
    updateAttachment(id: $id, fileName: $fileName) {
      id
      fileName
      mimeType
      createdAt
    }
  }
`;