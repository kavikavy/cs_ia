document.addEventListener("DOMContentLoaded", async function () {
    // Function to fetch data from an API endpoint
    async function fetchData(url, options = {}) {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    }

    // Fetch and display user's friends
    async function displayFriends() {
        try {
            const friends = await fetchData(`/api/friends`);
            const friendsList = document.getElementById('friendsList');
            friendsList.innerHTML = '';
            if (friends.length === 0) {
                friendsList.innerHTML = '<p>No current friends.</p>';
            } else {
                friends.forEach(username => {
                    const li = document.createElement('li');
                    li.textContent = username; // Display the username
                    friendsList.appendChild(li);
                });
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        }
    }

    // Fetch and display pending friend requests
    async function displayFriendRequests() {
        try {
            // Fetch pending requests for the logged-in user
            const response = await fetch('/api/friend-requests');
            if (!response.ok) throw new Error('Failed to fetch friend requests');

            const requests = await response.json();

            const requestsContainer = document.getElementById('friend-requests');
            requestsContainer.innerHTML = '';  // Clear the container

            if (requests.length === 0) {
                requestsContainer.innerHTML = '<p>No pending friend requests.</p>';
            } else {
                // Loop over the requests and display each one
                requests.forEach(request => {
                    const requestItem = document.createElement('div');
                    requestItem.innerHTML = `
                <p>${request.username} wants to be friends</p>
                <button onclick="acceptRequest(${request.userId})">Accept</button>
                <button onclick="declineRequest(${request.userId})">Decline</button>
            `;
                    requestsContainer.appendChild(requestItem);
                });
            }
        } catch (error) {
            console.error('Error fetching friend requests:', error);
        }
    }

    // Send a friend request
    document.getElementById('addFriendForm').addEventListener('submit', async function (e) {
        e.preventDefault();
        const friendUsername = document.getElementById('friend-username').value;
        console.log(friendUsername);

        try {
            const response = await fetch('/api/friend-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipientUsername: friendUsername }),
            });
            if (!response.ok) throw new Error('Failed to send friend request');
            alert('Friend request sent!');
            document.getElementById('friend-username').value = ''; // Clear the input field
        } catch (error) {
            //console.error('Error sending friend request:', error);
            alert('User does not exist!');
        }
    });

    // Accept a friend request
    window.acceptRequest = async function (friendUsername) {
        try {
            const response = await fetch('/api/accept-friend-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendUsername: friendUsername }),
            });
            if (response.ok) {
                alert('Friend request accepted!');
                displayFriends();  // Refresh friends list
                displayFriendRequests();  // Refresh pending requests list
            } else {
                throw new Error('Failed to accept friend request');
            }
        } catch (error) {
            console.error('Error accepting friend request:', error);
        }
    };

    // Decline a friend request
    window.declineRequest = async function (friendUsername) {
        try {
            await fetch('/api/decline-friend-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ friendUsername: friendUsername }),
            });
            alert('Friend request declined.');
            displayFriendRequests();
        } catch (error) {
            console.error('Error declining friend request:', error);
        }
    };

    // Initial display
    displayFriends();
    displayFriendRequests();
});