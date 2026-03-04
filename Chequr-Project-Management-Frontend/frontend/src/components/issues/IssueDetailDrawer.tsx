import React, { useState, useEffect, useRef } from 'react';
import { X, CheckSquare, Plus, Trash2, Send, Paperclip, ChevronDown, Check, Pencil, Download } from 'lucide-react';
import { Issue, IssuePriority, IssueType, User } from '../../types/issue.types';
import FloatingLabel from '../FloatingLabel';
import FloatingSelect from '../FloatingSelect';
import RichTextToolbar from '../RichTextToolbar';
import RichTextField, { RichTextFieldHandle } from '../RichTextField';
import FloatingTextArea from '../FloatingTextArea';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client/react';
import { GET_COMMENTS_BY_ISSUE_QUERY, GET_ATTACHMENTS_BY_ISSUE_QUERY, DOWNLOAD_ATTACHMENT_QUERY, GET_ISSUE_BY_ID_QUERY } from '../../graphql/issue.query';
import { UPDATE_ISSUE_MUTATION, CREATE_ISSUE_MUTATION, ADD_SUBTASK_MUTATION, TOGGLE_SUBTASK_MUTATION, DELETE_SUBTASK_MUTATION, DELETE_ISSUE_MUTATION, CREATE_COMMENT_MUTATION, DELETE_COMMENT_MUTATION, UPLOAD_ATTACHMENT_MUTATION, DELETE_ATTACHMENT_MUTATION, UPDATE_COMMENT_MUTATION, MOVE_ISSUE_MUTATION } from '../../graphql/issue.mutation';
import { GET_ALL_USERS_QUERY } from '../../graphql/user.query';
import { GET_PROJECT_QUERY } from '../../graphql/projects.query';
import toast from 'react-hot-toast';
import { store } from '../../redux/store';
import { confirmToast } from '../../utils/toast.utils';
import AttachmentPreviewModal from '../attachments/AttachmentPreviewModal';
import { Attachment } from '../../types/issue.types';

// --- Inline Components ---

interface IssueDescriptionFieldProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    isUpdating?: boolean;
    onImageClick?: () => void;
    onRemoveImage?: (id: string) => void;
    editorRef?: React.RefObject<RichTextFieldHandle | null>;
}

const IssueDescriptionField: React.FC<IssueDescriptionFieldProps> = ({ value, onSave,
    isUpdating,
    onImageClick,
    onRemoveImage,
    editorRef
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isEditing) {
            setTempValue(value);
        }
    }, [value, isEditing]);

    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            // Adjust height to fit content
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [isEditing]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setTempValue(e.target.value);
        // Auto-grow
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
    };

    const handleSave = async () => {
        await onSave(tempValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setTempValue(value);
        setIsEditing(false);
    };

    // Close edit mode if clicked outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Keep open to prevent data loss or auto-save if needed
            }
        };

        if (isEditing) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);


    if (isEditing) {
        return (
            <div ref={containerRef} className="animate-in fade-in duration-200">
                <FloatingTextArea
                    id="description-edit"
                    label="Description"
                    ref={editorRef}
                    value={tempValue}
                    onChange={(e: any) => setTempValue(e.target.value)}
                    onImageClick={onImageClick}
                    onRemoveImage={onRemoveImage}
                    richText={true}
                    showToolbar={true}
                />
                <div className="flex justify-end gap-2 mt-2">
                    <button
                        onClick={handleSave}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm active:scale-95"
                    >
                        {isUpdating ? 'Saving...' : 'Save'}
                    </button>
                    <button
                        onClick={handleCancel}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="group relative rounded-md -ml-2 p-2 hover:bg-gray-100/80 cursor-pointer transition-colors duration-200"
            onClick={() => setIsEditing(true)}
        >
            <div className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide select-none">
                Description
            </div>

            <div
                className="min-h-[60px] text-sm text-gray-900 leading-relaxed rich-text-content"
                dangerouslySetInnerHTML={{ __html: value || '<span class="text-gray-400 italic">Add a description...</span>' }}
            />

            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="p-1.5 bg-gray-200 text-gray-600 rounded hover:bg-gray-300">
                    <Pencil size={14} />
                </div>
            </div>
        </div>
    );
};

interface IssueCommentInputProps {
    onSave: (text: string) => Promise<void>;
    userInitials?: string;
    onImageClick?: () => void;
    onRemoveImage?: (id: string) => void;
    editorRef?: React.RefObject<RichTextFieldHandle | null>;
}

const IssueCommentInput: React.FC<IssueCommentInputProps> = (props) => {
    const [isfocused, setIsFocused] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const {
        onSave,
        userInitials = 'U',
        onImageClick,
        onRemoveImage,
        editorRef
    } = props;

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCommentText(e.target.value);
    };

    const handleSave = async () => {
        if (!commentText.trim()) return;
        setIsSaving(true);
        try {
            await onSave(commentText);
            setCommentText('');
            setIsFocused(false);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsFocused(false);
        // Optional: clear text or keep draft? Chequr keeps draft usually, but let's clear for now or keep it.
        // If I keep it, next time they click they see it.
    };

    // Auto-focus when entering edit mode
    useEffect(() => {
        if (isfocused && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [isfocused]);

    // Close if clicked outside? 
    // Usually comment inputs stay open if they have content, or collapse if empty.
    // For now, let's keep it simple: explicit Save/Cancel or click outside to collapse IF empty.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (!commentText.trim()) {
                    setIsFocused(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [commentText]);


    if (isfocused) {
        return (
            <div ref={containerRef} className="flex gap-3 animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600 shrink-0 mt-3">
                    {userInitials}
                </div>
                <div className="flex-1">
                    <div className={`relative border rounded-lg transition-all bg-white ${isfocused ? 'border-[#4F46E5] ring-2 ring-[#4F46E5]/20' : 'border-[#D1D5DB]'}`}>
                        <label
                            className={`
                                absolute left-[12px] px-[4px] bg-white
                                transition-all duration-200 pointer-events-none
                                -top-[9px] text-[11px] font-medium z-10 text-[#4F46E5]
                            `}
                        >
                            Comment
                        </label>

                        <div className="border-b border-gray-200">
                            <RichTextToolbar
                                onAction={(action) => {
                                    if (editorRef?.current) {
                                        editorRef.current.handleAction(action);
                                    }
                                }}
                                onImageClick={onImageClick}
                                className="rounded-t-lg"
                            />
                        </div>
                        <div className="relative">
                            <RichTextField
                                ref={editorRef}
                                value={commentText}
                                onChange={setCommentText}
                                onImageClick={onImageClick}
                                onRemoveImage={onRemoveImage}
                                placeholder="Add a comment..."
                                minHeight="100px"
                                showToolbar={false}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                className="border-none"
                            />
                        </div>
                    </div>
                    <div className="flex justify-start gap-2 mt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !commentText.trim()}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {isSaving ? 'Saving...' : 'Save'}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex gap-3 items-center group cursor-text" onClick={() => setIsFocused(true)}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600 shrink-0">
                {userInitials}
            </div>
            <div className="flex-1 relative">
                <div className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-500 bg-white hover:bg-gray-50 transition-colors shadow-sm font-medium">
                    Add a comment...
                </div>
            </div>
        </div>
    );
};

// --- End Inline Components ---

const graphqlUrl = import.meta.env.VITE_GRAPHQL_URL;

interface IssueDetailDrawerProps {
    issue: Issue | null;
    proposedStageId?: string;
    isOpen: boolean;
    onClose: (saved?: boolean) => void;
    onDelete?: () => void;
    stages?: { id: string; name: string }[];
}

const FloatingFileInput = ({
    label,
    id,
    onChange,
    multiple = false,
    error,
    containerClassName = ''
}: {
    label: string,
    id: string,
    onChange: (files: FileList | null) => void,
    multiple?: boolean,
    error?: string,
    containerClassName?: string
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [fileNames, setFileNames] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const names = Array.from(files).map(f => f.name).join(', ');
            setFileNames(names);
        } else {
            setFileNames('');
        }
        onChange(files);
    };

    const hasValue = fileNames !== '';
    const isFloating = isFocused || hasValue;

    return (
        <div className={`flex flex-col gap-2 ${containerClassName}`}>
            <div className="relative">
                <input
                    type="file"
                    id={id}
                    ref={inputRef}
                    onChange={handleFileChange}
                    multiple={multiple}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
                />
                <input
                    type="text"
                    value={fileNames}
                    readOnly
                    onClick={() => inputRef.current?.click()}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    className={`
                        w-full pl-[16px] pr-[44px] py-[10px] h-[48px]
                        bg-white border rounded-lg
                        transition-all text-[14px] text-[#374151]
                        cursor-pointer
                        focus:outline-hidden focus:ring-2 focus:ring-[#4F46E5]/20
                        ${error
                            ? 'border-red-500 focus:border-red-500'
                            : 'border-[#D1D5DB] focus:border-[#4F46E5]'
                        }
                    `}
                />
                <label
                    onClick={() => inputRef.current?.click()}
                    className={`
                        absolute left-[12px] px-[4px] bg-white
                        transition-all duration-200 pointer-events-none cursor-text
                        ${isFloating
                            ? '-top-[9px] text-[11px] font-medium z-10'
                            : 'top-[14px] text-[14px] font-normal'
                        }
                        ${error
                            ? 'text-red-500'
                            : isFocused
                                ? 'text-[#4F46E5]'
                                : 'text-[#9CA3AF]'
                        }
                    `}
                >
                    {label}
                </label>
                <button
                    type="button"
                    onClick={() => inputRef.current?.click()}
                    className="absolute right-[12px] top-[14px] text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Paperclip size={20} />
                </button>
            </div>
            {error && (
                <span className="text-[12px] text-red-500 font-medium ml-[4px]">
                    {error}
                </span>
            )}
        </div>
    );
};

// Custom Select for User with Avatar
const FloatingUserSelect = ({
    label,
    value,
    onChange,
    users,
    error
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    users: User[];
    error?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const selectedUser = users.find(u => u.id === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {label}
            </label>
            <div
                className={`
                    w-full px-[16px] py-[10px] h-[48px]
                    bg-white border rounded-lg
                    transition-all text-[14px] text-[#374151]
                    cursor-pointer flex items-center justify-between
                    hover:border-gray-400
                    ${isOpen ? 'ring-2 ring-[#4F46E5]/20 border-[#4F46E5]' : 'border-[#D1D5DB]'}
                    ${error ? 'border-red-500' : ''}
                `}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center space-x-3">
                    {selectedUser ? (
                        <>
                            {selectedUser.avatarUrl ? (
                                <img src={selectedUser.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-medium">
                                    {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
                                </div>
                            )}
                            <span className="truncate">{selectedUser.firstName} {selectedUser.lastName}</span>
                        </>
                    ) : (
                        <span className="text-gray-400">Unassigned</span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-500"
                        onClick={() => {
                            onChange('');
                            setIsOpen(false);
                        }}
                    >
                        Unassigned
                    </div>
                    {users.map(user => (
                        <div
                            key={user.id}
                            className={`
                                px-4 py-2 cursor-pointer flex items-center space-x-3 hover:bg-gray-50
                                ${user.id === value ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}
                            `}
                            onClick={() => {
                                onChange(user.id);
                                setIsOpen(false);
                            }}
                        >
                            {user.avatarUrl ? (
                                <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full object-cover" />
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-medium">
                                    {user.firstName?.[0]}{user.lastName?.[0]}
                                </div>
                            )}
                            <span className="text-sm">{user.firstName} {user.lastName}</span>
                            {user.id === value && <Check size={14} className="ml-auto text-indigo-600" />}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};


const IssueDetailDrawer: React.FC<IssueDetailDrawerProps> = ({ issue, proposedStageId, isOpen, onClose, onDelete, stages = [] }) => {
    const [stageId, setStageId] = useState<string>('');
    const [priority, setPriority] = useState<IssuePriority | ''>('');
    const [assigneeId, setAssigneeId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [comments, setComments] = useState('');
    const [type, setType] = useState<IssueType | ''>('');
    const [storyPoints, setStoryPoints] = useState<number | ''>('');
    const [dueDate, setDueDate] = useState('');
    const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [selectedAttachment, setSelectedAttachment] = useState<any | null>(null);
    const [selectedAttachmentUrl, setSelectedAttachmentUrl] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);


    // Subtasks State
    // const [newComment, setNewComment] = useState('');
    const [attachments, setAttachments] = useState<FileList | null>(null);
    const [blockedReason, setBlockedReason] = useState('');

    const [updateComment] = useMutation(UPDATE_COMMENT_MUTATION);

    const [activeEditor, setActiveEditor] = useState<'description' | 'comment' | null>(null);
    const descriptionEditorRef = useRef<RichTextFieldHandle>(null);
    const commentEditorRef = useRef<RichTextFieldHandle>(null);


    useEffect(() => {
        if (issue) {
            setStageId(proposedStageId || issue.stage?.id || issue.stageId || '');
            setPriority(issue.priority ? String(issue.priority) as IssuePriority : '');
            setAssigneeId(issue.assignee?.id || '');
            setDescription(issue.description || '');
            setType(issue.type ? String(issue.type) as IssueType : '');
            setStoryPoints(issue.storyPoints || '');
            setDueDate(issue.dueDate ? issue.dueDate.split('T')[0] : ''); // Format date for input
            setBlockedReason(issue.blockedReason || '');
        }
    }, [issue, proposedStageId]);

    const { data: issueData, loading: issueLoading, refetch: refetchIssue } = useQuery<any>(GET_ISSUE_BY_ID_QUERY, {
        variables: { id: issue?.id },
        skip: !issue?.id,
        fetchPolicy: 'cache-and-network' // Show cached data instantly, then sync fresh from server
    });

    const fullIssue = issueData?.getIssueById;

    useEffect(() => {
        if (fullIssue) {
            setStageId(proposedStageId || String(fullIssue.stage?.id || fullIssue.stageId || ''));
            setPriority(fullIssue.priority ? String(fullIssue.priority) as IssuePriority : '');
            setAssigneeId(fullIssue.assignee?.id ? String(fullIssue.assignee.id) : '');
            setDescription(fullIssue.description || '');
            setType(fullIssue.type ? String(fullIssue.type) as IssueType : '');
            setStoryPoints(fullIssue.storyPoints || '');
            setDueDate(fullIssue.dueDate ? fullIssue.dueDate.split('T')[0] : '');
            setBlockedReason(fullIssue.blockedReason || '');
            // Map subtasks from backend response
            if (fullIssue.subtaskList) {
                // Use the subtaskList directly from the query
                setSubtasks(fullIssue.subtaskList);
            } else if (fullIssue.subtasks) {
                // Fallback or ignore old subtasks
                const mappedSubtasks = fullIssue.subtasks.map((st: any) => ({
                    id: st.id,
                    title: st.title,
                    completed: st.stage?.isFinal || st.completed
                }));
                setSubtasks(mappedSubtasks);
            }
        } else if (issue) {
            // Fallback to prop data while loading or if query fails
            setStageId(proposedStageId || String(issue.stage?.id || issue.stageId || ''));
            setPriority(issue.priority ? String(issue.priority) as IssuePriority : '');
            setAssigneeId(issue.assignee?.id ? String(issue.assignee.id) : '');
            setDescription(issue.description || '');
            setType(issue.type ? String(issue.type) as IssueType : '');
            setStoryPoints(issue.storyPoints || '');
            setDueDate(issue.dueDate ? issue.dueDate.split('T')[0] : '');
            setBlockedReason(issue.blockedReason || '');
        }
    }, [fullIssue, issue, isOpen, proposedStageId]);

    // Fetch full project payload to get members list securely
    const projectId = fullIssue?.project?.id || issue?.project?.id;
    const { data: projectData } = useQuery<{ project: any }>(GET_PROJECT_QUERY, {
        variables: { id: projectId },
        skip: !projectId,
        fetchPolicy: 'cache-first'
    });

    // Derive assignable users purely from the project membership payload instead of global users
    const users = projectData?.project?.members || fullIssue?.project?.members || [];


    const [updateIssue] = useMutation(UPDATE_ISSUE_MUTATION);
    const [createIssue] = useMutation(CREATE_ISSUE_MUTATION); // For subtasks as issues
    const [addSubtask] = useMutation(ADD_SUBTASK_MUTATION);
    const [toggleSubtaskMutation] = useMutation(TOGGLE_SUBTASK_MUTATION);

    const [deleteSubtaskMutation] = useMutation(DELETE_SUBTASK_MUTATION);
    const [deleteIssueMutation] = useMutation<{ deleteIssue: boolean }>(DELETE_ISSUE_MUTATION);
    // Comments Logic
    const { data: commentsData, refetch: refetchComments } = useQuery<{ commentsByIssue: any[] }>(GET_COMMENTS_BY_ISSUE_QUERY, {
        variables: { issueId: issue?.id },
        skip: !issue?.id,
        fetchPolicy: 'network-only'
    });

    const [createComment] = useMutation(CREATE_COMMENT_MUTATION);
    const [deleteComment] = useMutation(DELETE_COMMENT_MUTATION);

    const handleCreateComment = async (text: string) => {
        if (!issue) return;
        try {
            await createComment({
                variables: {
                    input: {
                        issueId: issue.id,
                        content: text
                    }
                }
            });
            toast.success('Comment added');
            const { data: updatedCommentsData } = await refetchComments();
            await syncAttachments(undefined, updatedCommentsData?.commentsByIssue);
        } catch (error) {
            console.error('Failed to add comment', error);
            toast.error('Failed to add comment');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await deleteComment({
                variables: { id: commentId }
            });
            toast.success('Comment deleted');
            const { data: updatedCommentsData } = await refetchComments();
            await syncAttachments(undefined, updatedCommentsData?.commentsByIssue);
        } catch (error) {
            console.error('Failed to delete comment', error);
            toast.error('Failed to delete comment');
        }
    };

    // Attachments Logic
    const { data: attachmentsData, refetch: refetchAttachments } = useQuery<{ attachmentsByIssue: any[] }>(GET_ATTACHMENTS_BY_ISSUE_QUERY, {
        variables: { issueId: issue?.id },
        skip: !issue?.id,
        fetchPolicy: 'network-only'
    });

    const [uploadAttachment] = useMutation<{ uploadAttachment: any }>(UPLOAD_ATTACHMENT_MUTATION);
    const [deleteAttachment] = useMutation(DELETE_ATTACHMENT_MUTATION);
    const [downloadAttachmentQuery] = useLazyQuery<{ downloadAttachment: { fileName: string; mimeType: string; base64: string } }>(DOWNLOAD_ATTACHMENT_QUERY);

    const triggerAttachmentUpload = (source: 'description' | 'comment' = 'description') => {
        setActiveEditor(source);
        const fileInput = document.getElementById('attachment-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.click();
        }
    };

    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0 || !issue) return;

        const uploadPromises = Array.from(files).map(async (file) => {
            try {
                const { data } = await uploadAttachment({
                    variables: {
                        file,
                        issueId: issue.id
                    }
                });

                if (data?.uploadAttachment) {
                    const att = data.uploadAttachment;
                    const isImage = att.mimeType?.startsWith('image/');
                    if (isImage) {
                        const token = store.getState().auth.token;
                        const baseGraphqlUrl = graphqlUrl || '/graphql';
                        const baseUrl = baseGraphqlUrl.replace(/\/graphql$/, '');
                        const imageUrl = `${baseUrl}/attachments/${att.id}?token=${token}`;

                        // Use active editor to insert image with ID for deletion tracking
                        if (activeEditor === 'description' && descriptionEditorRef.current) {
                            descriptionEditorRef.current.insertImage(imageUrl, att.id);
                        } else if (activeEditor === 'comment' && commentEditorRef.current) {
                            commentEditorRef.current.insertImage(imageUrl, att.id);
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to upload ${file.name}`, error);
            }
        });

        await Promise.all(uploadPromises);
        await refetchIssue();
        await refetchAttachments();
    };

    const handleOpenPreview = (att: any) => {
        setSelectedAttachment(att);
        if (att.mimeType?.startsWith('image/')) {
            const token = store.getState().auth.token;
            const baseGraphqlUrl = graphqlUrl || '/graphql';
            const baseUrl = baseGraphqlUrl.replace(/\/graphql$/, '');
            const fullImageUrl = `${baseUrl}/attachments/${att.id}?token=${token}`;
            setSelectedAttachmentUrl(fullImageUrl);
        } else {
            setSelectedAttachmentUrl(null);
        }
    };

    const handleDownloadAttachment = async (attachment: any) => {
        try {
            const { data } = await downloadAttachmentQuery({ variables: { id: attachment.id } });
            if (data?.downloadAttachment) {
                const { fileName, mimeType, base64 } = data.downloadAttachment;

                // Convert base64 to Blob
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        } catch (error) {
            console.error('Failed to download', error);
            toast.error('Failed to download attachment');
        }
    };

    const handleDeleteAttachment = async (attachmentId: string) => {
        const confirmed = await confirmToast(
            'Delete Attachment',
            'Are you sure you want to delete this attachment? This action cannot be undone.',
            'delete'
        );
        if (!confirmed) return;
        try {
            await deleteAttachment({ variables: { id: attachmentId } });
            toast.success('Attachment deleted', { id: `delete-${attachmentId}` });
            refetchAttachments();

            // Reverse Sync: Scrub from description if present to avoid broken images
            if (description && description.includes(attachmentId)) {
                const imgRegex = new RegExp(`<img[^>]*${attachmentId}[^>]*>`, 'gi');
                const newDescription = description.replace(imgRegex, '');

                if (newDescription !== description) {
                    setDescription(newDescription);
                    // Immediate save for description consistency
                    if (fullIssue) {
                        try {
                            await updateIssue({
                                variables: {
                                    input: {
                                        issueId: fullIssue.id,
                                        description: newDescription,
                                        // Use original issue values for other fields during inline sync
                                        priority: fullIssue.priority,
                                        assigneeId: fullIssue.assigneeId,
                                        title: fullIssue.title,
                                        type: fullIssue.type,
                                        storyPoints: fullIssue.storyPoints || null,
                                        dueDate: fullIssue.dueDate ? new Date(fullIssue.dueDate).toISOString() : null
                                    }
                                }
                            });
                            refetchIssue();
                        } catch (err) {
                            console.error('Failed to sync description after attachment deletion', err);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Failed to delete attachment', error);
            toast.error('Failed to delete attachment');
        }
    };

    const syncAttachments = async (updatedDescription?: string, updatedComments?: any[]) => {
        if (!issue || !attachmentsData?.attachmentsByIssue) return;

        const currentAttachments = attachmentsData.attachmentsByIssue;
        const currentComments = updatedComments || commentsData?.commentsByIssue || [];

        const allContent = [
            updatedDescription !== undefined ? updatedDescription : description,
            ...currentComments.map((c: any) => c.content)
        ].join(' ');

        // Match UUID with or without /attachments/ prefix to be safer
        const idRegex = /([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/gi;
        const usedIds = new Set<string>();
        let match;
        while ((match = idRegex.exec(allContent)) !== null) {
            usedIds.add(match[1].toLowerCase());
        }

        const orphans = currentAttachments.filter((att: Attachment) =>
            att.mimeType?.startsWith('image/') && !usedIds.has(att.id.toLowerCase())
        );

        if (orphans.length === 0) return;

        try {
            await Promise.all(orphans.map((orphan: Attachment) =>
                deleteAttachment({ variables: { id: orphan.id } })
            ));
            refetchAttachments();
        } catch (err) {
            console.error('Failed to auto-delete orphan attachments', err);
        }
    };

    const handleEditClick = (comment: any) => {
        setEditingCommentId(comment.id);
        setEditContent(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditContent('');
    };

    const handleUpdateComment = async () => {
        if (!editingCommentId || !editContent.trim()) return;

        try {
            await updateComment({
                variables: {
                    input: {
                        commentId: editingCommentId,
                        content: editContent
                    }
                }
            });
            toast.success('Comment updated');
            setEditingCommentId(null);
            setEditContent('');
            const { data: updatedCommentsData } = await refetchComments();
            await syncAttachments(undefined, updatedCommentsData?.commentsByIssue);
        } catch (error) {
            console.error('Failed to update comment', error);
            toast.error('Failed to update comment');
        }
    };

    const [moveIssue] = useMutation(MOVE_ISSUE_MUTATION, {
        refetchQueries: ['GetBoardIssues']
    });

    const handleSave = async () => {
        if (!issue) return;

        // Check if status is set to Blocked and verify reason is provided
        const targetStage = stages.find(s => s.id === stageId);
        const isTargetBlocked = targetStage?.name.toLowerCase().trim() === 'blocked' ||
            targetStage?.id.toLowerCase().trim() === 'blocked' ||
            stageId.toLowerCase().trim() === 'blocked';

        if (isTargetBlocked && !blockedReason.trim()) {
            toast.error('Please provide a reason for blocking this issue.', { position: 'bottom-right' });
            return;
        }

        try {
            // 1. Update issue basic info (excluding status, which is handled via moveIssue)
            await updateIssue({
                variables: {
                    input: {
                        issueId: issue.id,
                        blockedReason,
                        priority,
                        assigneeId: assigneeId || null,
                        title: issue.title,
                        description: description || '',
                        storyPoints: storyPoints !== '' ? Number(storyPoints) : null,
                        dueDate: dueDate ? new Date(dueDate).toISOString() : null
                    }
                },
                refetchQueries: ['GetBoardIssues']
            });

            // 2. Update status (stage) if changed
            const currentStageId = String(fullIssue?.stage?.id || issue.stage?.id || issue.stageId || '');

            // MAP SHIM ID TO REAL BACKEND ID IF NECESSARY
            let finalTargetStageId = stageId;
            if (stageId && stageId.startsWith('local-')) {
                const targetStage = stages.find(s => s.id === stageId);
                if (targetStage && !targetStage.id.startsWith('local-')) {
                    finalTargetStageId = targetStage.id;
                } else {
                    // If it's still local, we can't move it on the backend yet
                    console.warn(`[Detail] Cannot move to local stage ${stageId} - no backend ID found`);
                    finalTargetStageId = '';
                }
            }

            if (finalTargetStageId && finalTargetStageId !== currentStageId) {
                await moveIssue({
                    variables: {
                        input: {
                            issueId: issue.id,
                            stageId: finalTargetStageId
                        }
                    }
                });
            }

            toast.success('Issue updated');
            try {
                await syncAttachments();
            } catch (e) {
                console.error('Post-update sync failed', e);
            }
            onClose(true);
        } catch (error) {
            console.error('Failed to update issue', error);
            toast.error('Failed to update issue');
        }
    };

    const handleAddSubtask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubtaskTitle.trim() || !issue) return;

        try {
            await addSubtask({
                variables: {
                    issueId: issue.id,
                    title: newSubtaskTitle
                }
            });
            setNewSubtaskTitle('');
            toast.success('Subtask created');
            refetchIssue();
        } catch (error) {
            console.error('Failed to create subtask', error);
            toast.error('Failed to create subtask');
        }
    };

    const toggleSubtask = async (id: string) => {
        try {
            await toggleSubtaskMutation({
                variables: { subtaskId: id }
            });
            // Update local state optimistically or wait for refetch
            setSubtasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
        } catch (error) {
            console.error('Failed to toggle subtask', error);
            toast.error('Failed to toggle subtask');
        }
    };

    const deleteSubtask = async (id: string) => {
        try {
            await deleteSubtaskMutation({
                variables: { subtaskId: id }
            });
            setSubtasks(prev => prev.filter(t => t.id !== id));
            toast.success('Subtask deleted');
        } catch (error) {
            console.error('Failed to delete subtask', error);
            toast.error('Failed to delete subtask');
        }
    };

    const performDelete = async () => {
        if (!issue) return;
        try {
            const result = await deleteIssueMutation({
                variables: { id: issue.id }
            });

            console.log("DELETE RESULT:", result);
            console.log("DELETE BOOLEAN:", result?.data?.deleteIssue);

            if (result.data?.deleteIssue === true) {
                toast.success('Issue deleted');
                if (onDelete) {
                    onDelete();
                } else {
                    onClose();
                }
            } else {
                toast.error('Failed to delete issue');
            }

        } catch (error) {
            console.error('Failed to delete issue', error);
            toast.error('Failed to delete issue');
        }
    };

    const handleDeleteIssue = () => {
        if (!issue) return;

        toast((t) => (
            <div className="flex flex-col gap-3 min-w-[200px]">
                <div className="font-medium text-sm text-gray-900">
                    Delete this issue?
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        onClick={() => toast.dismiss(t.id)}
                    >
                        Cancel
                    </button>
                    <button
                        className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                        onClick={() => {
                            toast.dismiss(t.id);
                            performDelete();
                        }}
                    >
                        Delete
                    </button>
                </div>
            </div>
        ), {
            duration: 6000,
            position: 'top-center',
            style: {
                background: '#fff',
                color: '#1f2937',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                padding: '16px',
                borderRadius: '8px',
            },
        });
    };

    // Construct display Key
    const projectKey = fullIssue?.project?.key || issue?.project?.key;
    const issueKey = projectKey ? `${projectKey}-${issue?.id.slice(0, 4) || '...'}` : issue?.id.slice(0, 8);

    if (!isOpen || !issue) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div
                className="absolute inset-0 bg-black/40 transition-opacity"
                onClick={() => onClose(false)}
            ></div>
            <div className="relative w-full max-w-4xl h-full bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out translate-x-0">
                <div className="p-8 h-full flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-500">
                                {issueKey}
                            </span>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleDeleteIssue}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                            <button onClick={() => onClose(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col mb-8">
                        <h2 className="text-2xl font-bold text-[#1a202c] leading-tight">{fullIssue?.title || issue.title}</h2>
                        {issueLoading && <span className="text-xs text-gray-400 mt-1">Loading details...</span>}

                        {/* Pending Stage Change Banner */}
                        {proposedStageId && proposedStageId !== (fullIssue?.stage?.id || issue.stage?.id || issue.stageId) && (() => {
                            const fromStage = stages.find(s => s.id === (fullIssue?.stage?.id || issue.stage?.id || issue.stageId));
                            const toStage = stages.find(s => s.id === proposedStageId);
                            return (
                                <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                                    <span className="text-xs font-semibold text-amber-800">
                                        Stage change pending:
                                    </span>
                                    <span className="text-xs font-medium text-amber-700">
                                        {fromStage?.name || 'Unknown'} → {toStage?.name || 'Unknown'}
                                    </span>
                                    <span className="text-xs text-amber-600 ml-auto italic">
                                        Click "Save Changes" to confirm
                                    </span>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex gap-12">
                        {/* Main Column (Left) */}
                        <div className="flex-1 space-y-8">

                            {/* Description */}
                            <div className="mb-6">
                                <IssueDescriptionField
                                    value={description}
                                    onImageClick={() => triggerAttachmentUpload('description')}
                                    onRemoveImage={handleDeleteAttachment}
                                    editorRef={descriptionEditorRef}
                                    onSave={async (newVal) => {
                                        setDescription(newVal);
                                        // We need to trigger a save operation similar to handleSave but specifically for description or just rely on state if handleSave saves everything.
                                        // The requirement says "Save updates description and returns to view mode".
                                        // If we just update state, it won't persist until the main "Save Changes" button is clicked.
                                        // However, in Jira, inline edits usually save immediately.
                                        // Let's reuse the updateIssue mutation logic here for immediate save, 
                                        // OR if the user expects it to be part of the main form save.
                                        // "Save (primary) and Cancel (secondary) buttons at bottom-right inside the fieldset." implies immediate action.
                                        // I'll implement an immediate save for the description field.

                                        if (!issue) return;
                                        try {
                                            await updateIssue({
                                                variables: {
                                                    input: {
                                                        issueId: issue.id,
                                                        description: newVal,
                                                        priority: priority || issue.priority,
                                                        assigneeId: assigneeId || null,
                                                        title: issue.title,
                                                        type: type || issue.type,
                                                        storyPoints: storyPoints !== '' ? Number(storyPoints) : (issue.storyPoints || null),
                                                        dueDate: dueDate ? new Date(dueDate).toISOString() : (issue.dueDate || null)
                                                    }
                                                }
                                            });
                                            toast.success('Description updated');
                                            try {
                                                await refetchIssue();
                                                await syncAttachments(newVal);
                                            } catch (e) {
                                                console.error('Post-update sync failed', e);
                                            }
                                        } catch (error) {
                                            console.error('Failed to update description', error);
                                            toast.error('Failed to update description');
                                        }
                                    }}
                                />
                            </div>

                            {/* Attachments */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                                    Attachments
                                </label>
                                <FloatingFileInput
                                    id="attachment-upload"
                                    label="Add attachments"
                                    onChange={handleFileUpload}
                                    multiple
                                    containerClassName="mb-4"
                                />
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                    {attachmentsData?.attachmentsByIssue?.map((att: any) => {
                                        const isImage = att.mimeType?.startsWith('image/');
                                        const formattedSize = att.fileSize
                                            ? att.fileSize > 1024 * 1024
                                                ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                                : `${(att.fileSize / 1024).toFixed(0)} KB`
                                            : '';

                                        return (
                                            <div key={att.id} className="relative group w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-white">
                                                {isImage && att.base64 ? (
                                                    <img
                                                        src={`data:${att.mimeType};base64,${att.base64}`}
                                                        alt={att.fileName}
                                                        className="w-full h-full object-cover cursor-pointer"
                                                        onClick={() => handleOpenPreview(att)}
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full flex flex-col items-center justify-center bg-gray-50 cursor-pointer"
                                                        onClick={() => handleOpenPreview(att)}
                                                    >
                                                        <Paperclip size={24} className="text-gray-400 mb-1" />
                                                        <span className="text-[10px] text-gray-500 px-2 text-center truncate w-full">
                                                            {att.fileName}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Info Bar (Always visible but semi-transparent) */}
                                                <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-2 py-1 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-600">
                                                    <span className="truncate flex-1 font-medium">{att.fileName}</span>
                                                    <span className="ml-1 opacity-60">{formattedSize}</span>
                                                </div>

                                                {/* Hover Overlay */}
                                                <div
                                                    className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-start justify-end p-2 gap-2 cursor-pointer"
                                                    onClick={() => handleOpenPreview(att)}
                                                >
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDownloadAttachment(att);
                                                        }}
                                                        className="bg-white p-1.5 rounded-md shadow-lg hover:bg-gray-100 transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={14} className="text-gray-700" />
                                                    </button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteAttachment(att.id);
                                                        }}
                                                        className="bg-white p-1.5 rounded-md shadow-lg hover:bg-red-50 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} className="text-red-600" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Subtasks */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                                    Subtasks
                                </label>
                                <div className="space-y-2 mb-3">
                                    {subtasks.map((task) => (
                                        <div key={task.id} className="flex items-center justify-between group py-2 hover:bg-gray-50 rounded">
                                            <div className="flex items-center space-x-3">
                                                <button
                                                    className={`
                                                        w-5 h-5 rounded border flex items-center justify-center transition-colors
                                                        ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-gray-400'}
                                                    `}
                                                    onClick={() => toggleSubtask(task.id)}
                                                >
                                                    {task.completed && <Check size={14} className="text-white" />}
                                                </button>
                                                <span className={`text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                                    {task.title}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => deleteSubtask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <form onSubmit={handleAddSubtask} className="flex items-center space-x-2 mt-2">
                                    <input
                                        type="text"
                                        className="flex-1 block w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                                        placeholder="Add a subtask..."
                                        value={newSubtaskTitle}
                                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newSubtaskTitle.trim()}
                                        className="p-2 border border-brand-100 rounded-md text-brand-600 bg-brand-50 hover:bg-brand-100"
                                    >
                                        <Plus size={20} className="text-indigo-600" />
                                    </button>
                                </form>
                            </div>

                            {/* Comments */}
                            <div className="relative">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                                    Comments
                                </label>
                                <div className="space-y-4 mb-6">
                                    {commentsData?.commentsByIssue?.map((comment: any) => (
                                        <div key={comment.id} className="flex gap-3 group">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 shrink-0">
                                                {comment.author?.avatarUrl ? (
                                                    <img src={comment.author.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                                                ) : (
                                                    <span>{comment.author?.firstName?.[0]}{comment.author?.lastName?.[0]}</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {comment.author?.firstName} {comment.author?.lastName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(comment.createdAt).toLocaleString()}
                                                        {comment.isEdited && <span className="text-gray-400 ml-1">(edited)</span>}
                                                    </span>
                                                    {!editingCommentId && (
                                                        <div className="ml-auto flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleEditClick(comment)}
                                                                className="p-1 text-gray-400 hover:text-indigo-500"
                                                                title="Edit comment"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteComment(comment.id)}
                                                                className="p-1 text-gray-400 hover:text-red-500"
                                                                title="Delete comment"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                {editingCommentId === comment.id ? (
                                                    <div className="mt-2">
                                                        <textarea
                                                            value={editContent}
                                                            onChange={(e) => setEditContent(e.target.value)}
                                                            className="w-full text-sm border-gray-300 rounded-md p-2 border focus:ring-indigo-500 focus:border-indigo-500"
                                                            rows={3}
                                                            autoFocus
                                                        />
                                                        <div className="flex justify-end space-x-2 mt-2">
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={handleUpdateComment}
                                                                className="px-3 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                                                            >
                                                                Save
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                                        {comment.content}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <IssueCommentInput
                                    userInitials="ME"
                                    onImageClick={() => triggerAttachmentUpload('comment')}
                                    onRemoveImage={handleDeleteAttachment}
                                    editorRef={commentEditorRef}
                                    onSave={handleCreateComment}
                                />
                            </div>
                        </div>

                        {/* Sidebar Column (Right) */}
                        <div className="w-80 space-y-6">
                            {/* Status */}
                            <div>
                                <FloatingSelect
                                    id="status"
                                    label="Status"
                                    value={stageId}
                                    onChange={(e: any) => setStageId(e.target.value)}
                                >
                                    <option value="" disabled hidden>Select Status</option>
                                    {(
                                        stages.length > 0
                                            ? stages
                                            : (fullIssue?.project?.workflow?.stages || issue?.project?.workflow?.stages || [])
                                    ).filter((s: any) => s && s.id && s.name).map((s: any) => (
                                        <option key={s.id} value={String(s.id)}>{s.name}</option>
                                    ))}
                                </FloatingSelect>
                            </div>


                            {/* Priority */}
                            <div>
                                <FloatingSelect
                                    id="priority"
                                    label="Priority"
                                    value={priority}
                                    onChange={(e: any) => setPriority(e.target.value as IssuePriority)}
                                >
                                    <option value="" disabled hidden>Select Priority</option>
                                    {Object.values(IssuePriority).filter(p => p).map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </FloatingSelect>
                            </div>

                            {/* Assignee */}
                            <FloatingUserSelect
                                label="Assignee"
                                value={assigneeId}
                                onChange={(val) => setAssigneeId(val)}
                                users={users}
                            />

                            {/* Issue Type */}
                            <div>
                                <FloatingSelect
                                    id="type"
                                    label="Issue Type"
                                    value={type}
                                    onChange={(e: any) => setType(e.target.value as IssueType)}
                                >
                                    <option value="" disabled hidden>Select Issue Type</option>
                                    {Object.values(IssueType).filter(t => t).map((t) => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </FloatingSelect>
                            </div>

                            {/* Story Points */}
                            <div>
                                <FloatingLabel
                                    id="detail-story-points"
                                    label="Story Points"
                                    type="number"
                                    value={storyPoints}
                                    onChange={(e) => setStoryPoints(e.target.value ? Number(e.target.value) : '')}
                                />
                            </div>

                            {/* Due Date */}
                            <div>
                                <FloatingLabel
                                    id="detail-due-date"
                                    label="Due Date"
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </div>

                            {/* Blocked Reason - Mandatory conditional field */}
                            {stages.find(s => s.id === stageId)?.name.toUpperCase() === 'BLOCKED' && (
                                <div className="animate-in slide-in-from-top-2 duration-300">
                                    <fieldset className="border-2 border-red-500 rounded-md p-0 relative bg-red-50/30">
                                        <legend className="ml-3 px-1 text-xs font-semibold text-red-600">
                                            Blocked Reason *
                                        </legend>
                                        <div className="px-3 pb-3">
                                            <textarea
                                                value={blockedReason}
                                                onChange={(e) => setBlockedReason(e.target.value)}
                                                className="w-full text-sm text-gray-900 resize-none outline-none bg-transparent placeholder-red-300 min-h-[80px] leading-relaxed pt-2"
                                                placeholder="Please specify why this issue is blocked..."
                                                required
                                            />
                                        </div>
                                    </fieldset>
                                    <p className="text-[10px] text-red-500 mt-1 font-medium ml-1 italic">
                                        Status cannot be saved as 'Blocked' without a reason.
                                    </p>
                                </div>
                            )}

                            {/* Reporter Info */}
                            <div className="pt-6 border-t border-gray-100">
                                <dl>
                                    <div className="mb-4">
                                        <dt className="text-xs font-medium text-gray-500">Reporter</dt>
                                        <dd className="mt-1 text-xs text-gray-900 flex items-center space-x-2">
                                            {issue.reporter?.avatarUrl ? (
                                                <img src={issue.reporter.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                                            ) : (
                                                <div className="h-5 w-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                                                    {issue.reporter?.firstName?.[0]}{issue.reporter?.lastName?.[0]}
                                                </div>
                                            )}
                                            <span>{issue.reporter?.firstName || 'Unknown'} {issue.reporter?.lastName || ''}</span>
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs font-medium text-gray-500">Created</dt>
                                        <dd className="mt-1 text-xs text-gray-900">
                                            {new Date(issue.createdAt).toLocaleDateString()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="mt-auto px-6 py-4 bg-gray-50 flex justify-end space-x-3 -mx-8 -mb-8">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={stages.find(s => s.id === stageId)?.name.toUpperCase() === 'BLOCKED' && !blockedReason.trim()}
                            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white transition-all
                                ${stages.find(s => s.id === stageId)?.name.toUpperCase() === 'BLOCKED' && !blockedReason.trim()
                                    ? 'bg-gray-400 cursor-not-allowed opacity-50'
                                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'}
                            `}
                        >
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            {/* Attachment Preview Drawer */}
            <AttachmentPreviewModal
                isOpen={!!selectedAttachment}
                onClose={() => {
                    setSelectedAttachment(null);
                    setSelectedAttachmentUrl(null);
                }}
                attachment={selectedAttachment}
                imageUrl={selectedAttachmentUrl}
                onDownload={handleDownloadAttachment}
                onRefetch={refetchAttachments}
            />
        </div>
    );
};

export default IssueDetailDrawer;
