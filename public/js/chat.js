// chat.js

// chat.js

let currentEditingMessageId = null;

function startEdit(button) {
    const messageDiv = button.closest('.message');
    const messageId = messageDiv.dataset.messageId;
    const messageTextElement = messageDiv.querySelector('.message-text');
    const originalText = messageTextElement.textContent;

    // Create input field
    const inputField = document.createElement('input');
    inputField.type = 'text';
    inputField.value = originalText;
    inputField.className = 'edit-input';

    // Create save button
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save';
    saveButton.onclick = () => saveEdit(messageId, inputField.value);

    // Create cancel button
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.onclick = () => cancelEdit(messageTextElement, originalText);

    // Replace message text with input and buttons
    messageTextElement.innerHTML = '';
    messageTextElement.appendChild(inputField);
    messageTextElement.appendChild(saveButton);
    messageTextElement.appendChild(cancelButton);

    currentEditingMessageId = messageId;
}

async function saveEdit(messageId, newText) {
    try {
        const response = await fetch(`/chat/message/${messageId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: newText })
        });

        if (!response.ok) {
            throw new Error('Failed to update message');
        }

        const updatedMessage = await response.json();
        
        // Update the message in the UI
        const messageDiv = document.querySelector(`[data-message-id="${messageId}"]`);
        const messageTextElement = messageDiv.querySelector('.message-text');
        messageTextElement.textContent = updatedMessage.message;

        // Add edited tag if not present
        if (!messageDiv.querySelector('.edited-tag')) {
            const timeSpan = messageDiv.querySelector('.message-time');
            const editedTag = document.createElement('span');
            editedTag.className = 'edited-tag';
            editedTag.textContent = '(edited)';
            timeSpan.after(editedTag);
        }

        currentEditingMessageId = null;
    } catch (error) {
        console.error('Error updating message:', error);
        alert('Failed to update message');
    }
}

function cancelEdit(messageTextElement, originalText) {
    messageTextElement.textContent = originalText;
    currentEditingMessageId = null;
}

async function deleteMessage(button) {
    if (!confirm('Are you sure you want to delete this message?')) {
        return;
    }

    const messageDiv = button.closest('.message');
    const messageId = messageDiv.dataset.messageId;

    try {
        const response = await fetch(`/chat/message/${messageId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error('Failed to delete message');
        }

        // Remove the message from the UI
        messageDiv.remove();
    } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
    }
}

// Add some CSS to support editing
const style = document.createElement('style');
style.textContent = `
    .message-actions {
        display: none;
        margin-left: 10px;
    }

    .message:hover .message-actions {
        display: flex;
        gap: 5px;
    }

    .edit-input {
        margin-right: 5px;
        padding: 2px 5px;
    }

    .edited-tag {
        font-size: 0.8em;
        color: #666;
        margin-left: 5px;
    }
`;
document.head.appendChild(style);