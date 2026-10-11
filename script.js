
"use strict";

// Shortcuts
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const STORAGE = {
  posts: "socialconnect_posts_v1",
  chats: "socialconnect_chats_v1",
  profile: "socialconnect_profile_v1",
  theme: "socialconnect_theme_v1",
  accent: "socialconnect_accent_v1",
  font: "socialconnect_font_v1",
  bookmarks: "socialconnect_bookmarks_v1"
};

function readData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("Browser storage is full or unavailable.", error);
    showToast("Browser storage is full. Try a smaller photo.");
    return false;
  }
}

// Toast notification
let toastTimer;

function showToast(message) {
  const toast = $("#toast");
  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2600);
}

// Profile name
const savedProfile = readData(STORAGE.profile, null);

if (savedProfile?.name) {
  $("#profileName").textContent = savedProfile.name;
  $(".profile-mini h3").textContent = savedProfile.name;
  $("#postText").placeholder =
    "What's on your mind, " + savedProfile.name + "?";
}

// Edit profile
$("#editProfile").addEventListener("click", () => {
  const currentName = $("#profileName").textContent;
  const name = prompt("Enter your profile name:", currentName);

  if (!name || !name.trim()) return;

  const cleanName = name.trim().slice(0, 40);

  $("#profileName").textContent = cleanName;
  $(".profile-mini h3").textContent = cleanName;
  $("#postText").placeholder =
    "What's on your mind, " + cleanName + "?";

  saveData(STORAGE.profile, { name: cleanName });
  showToast("Profile name updated!");
});

// Open create-post area
function openComposer() {
  $("#createPost").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });

  $("#postText").focus();
}

$("#topCreate").addEventListener("click", openComposer);
$("#sidebarCreate").addEventListener("click", openComposer);
$("#profileCreate").addEventListener("click", openComposer);

// Image and video preview
$("#postImage").addEventListener("change", function () {
  const file = this.files[0];
  const preview = $("#previewArea");

  preview.replaceChildren();

  if (!file) {
    $("#fileName").textContent = "No file selected";
    return;
  }

  if (!file.type.startsWith("image/") &&
      !file.type.startsWith("video/")) {
    showToast("Choose an image or video.");
    this.value = "";
    $("#fileName").textContent = "No file selected";
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showToast("Choose a file smaller than 5 MB for this demo.");
    this.value = "";
    $("#fileName").textContent = "No file selected";
    return;
  }

  $("#fileName").textContent = file.name;

  const media = document.createElement(
    file.type.startsWith("video/") ? "video" : "img"
  );

  media.src = URL.createObjectURL(file);
  media.className = "post-media";
  media.controls = file.type.startsWith("video/");
  media.alt = "Selected post preview";

  preview.appendChild(media);
});

// Build a post safely
function createPostElement(post) {
  const article = document.createElement("article");
  article.className = "panel post-card searchable-post";
  article.dataset.postId = post.id;

  const header = document.createElement("div");
  header.className = "post-header";

  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src = "images/poojitha.jpg";
  avatar.alt = post.author || "Poojitha";

  const user = document.createElement("div");
  user.className = "post-user";

  const name = document.createElement("h3");
  name.textContent = post.author || "Poojitha";

  const time = document.createElement("p");
  time.textContent = post.time || "Just now · Public";

  user.append(name, time);

  const more = document.createElement("button");
  more.className = "icon-btn more-btn";
  more.setAttribute("aria-label", "More options");
  more.innerHTML = '<i class="fa-solid fa-ellipsis"></i>';

  header.append(avatar, user, more);
  article.appendChild(header);

  if (post.text) {
    const caption = document.createElement("p");
    caption.className = "post-caption";
    caption.textContent = post.text;
    article.appendChild(caption);
  }

  if (post.media) {
    const media = document.createElement(
      post.mediaType === "video" ? "video" : "img"
    );

    media.className = "post-media";
    media.src = post.media;
    media.alt = "Post by " + (post.author || "Poojitha");

    if (post.mediaType === "video") {
      media.controls = true;
      media.playsInline = true;
    }

    article.appendChild(media);
  }

  const actions = document.createElement("div");
  actions.className = "post-actions";

  actions.innerHTML = `
    <button class="action-btn like-btn">
      <i class="fa-regular fa-heart"></i>
      <span>${Number(post.likes) || 0}</span>
    </button>
    <button class="action-btn comment-btn">
      <i class="fa-regular fa-comment"></i>
      <span>${(post.comments || []).length}</span>
    </button>
    <button class="action-btn share-btn">
      <i class="fa-solid fa-share"></i> Share
    </button>
    <button class="action-btn bookmark-btn" aria-label="Bookmark">
      <i class="fa-regular fa-bookmark"></i>
    </button>
  `;

  article.appendChild(actions);

  const commentsArea = document.createElement("div");
  commentsArea.className = "comments-area hidden";

  const commentList = document.createElement("div");
  commentList.className = "comment-list";

  (post.comments || []).forEach(comment => {
    const p = document.createElement("p");
    p.textContent = comment;
    commentList.appendChild(p);
  });

  const form = document.createElement("form");
  form.className = "comment-form";

  const input = document.createElement("input");
  input.className = "comment-input";
  input.placeholder = "Write a comment...";
  input.maxLength = 300;
  input.setAttribute("aria-label", "Write a comment");

  const send = document.createElement("button");
  send.className = "primary-btn";
  send.type = "submit";
  send.textContent = "Send";

  form.append(input, send);
  commentsArea.append(commentList, form);
  article.appendChild(commentsArea);

  return article;
}

// Load posts created by this browser
let userPosts = readData(STORAGE.posts, []);

if (!Array.isArray(userPosts)) userPosts = [];

function updatePostCount() {
  $("#postCount").textContent = 3 + userPosts.length;
}

function renderSavedPosts() {
  const postsList = $("#postsList");

  userPosts.forEach(post => {
    postsList.prepend(createPostElement(post));
  });

  updatePostCount();
}

renderSavedPosts();

// Create and publish a new post
$("#sharePost").addEventListener("click", async () => {
  const text = $("#postText").value.trim();
  const file = $("#postImage").files[0];

  if (!text && !file) {
    showToast("Write something or choose a photo/video first.");
    return;
  }

  if (file && file.size > 5 * 1024 * 1024) {
    showToast("Please choose a file smaller than 5 MB.");
    return;
  }

  const button = $("#sharePost");
  button.disabled = true;

  try {
    let media = "";
    let mediaType = "";

    if (file) {
      // Data URL lets small images persist after refresh.
      media = await new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });

      mediaType = file.type.startsWith("video/") ? "video" : "image";
    }

    const post = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      author: $("#profileName").textContent,
      text,
      media,
      mediaType,
      likes: 0,
      comments: [],
      time: "Just now · Public"
    };

    const updatedPosts = [post, ...userPosts];

    if (!saveData(STORAGE.posts, updatedPosts)) return;

    userPosts = updatedPosts;
    $("#postsList").prepend(createPostElement(post));

    $("#postText").value = "";
    $("#postImage").value = "";
    $("#previewArea").replaceChildren();
    $("#fileName").textContent = "No file selected";

    updatePostCount();
    showToast("Your post was published!");
    $("#postsList").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error(error);
    showToast("Unable to publish. Please try a smaller file.");
  } finally {
    button.disabled = false;
  }
});

// Get a post's saved data
function findUserPost(id) {
  return userPosts.find(post => post.id === id);
}

// Like, comments, bookmarks and share
document.addEventListener("click", async event => {
  const button = event.target.closest("button");
  if (!button) return;

  const postElement = button.closest(".post-card");

  if (button.classList.contains("like-btn") && postElement) {
    const count = $("span", button);
    const icon = $("i", button);
    const liked = button.classList.toggle("liked");

    icon.className = liked
      ? "fa-solid fa-heart"
      : "fa-regular fa-heart";

    const number = Number(count.textContent);
    count.textContent = Math.max(0, number + (liked ? 1 : -1));

    const post = findUserPost(postElement.dataset.postId);

    if (post) {
      post.likes = Number(count.textContent);
      saveData(STORAGE.posts, userPosts);
    }
  }

  if (button.classList.contains("comment-btn") && postElement) {
    const area = $(".comments-area", postElement);
    area.classList.toggle("hidden");

    if (!area.classList.contains("hidden")) {
      $(".comment-input", area).focus();
    }
  }

  if (button.classList.contains("bookmark-btn") && postElement) {
    const id = postElement.dataset.postId;
    const bookmarks = readData(STORAGE.bookmarks, []);
    const icon = $("i", button);
    const exists = bookmarks.includes(id);

    const next = exists
      ? bookmarks.filter(item => item !== id)
      : [...bookmarks, id];

    saveData(STORAGE.bookmarks, next);

    icon.className = exists
      ? "fa-regular fa-bookmark"
      : "fa-solid fa-bookmark";

    showToast(exists ? "Bookmark removed." : "Post bookmarked!");
  }

  if (button.classList.contains("share-btn") && postElement) {
    const caption = $(".post-caption", postElement)?.textContent || "";

    try {
      if (navigator.share) {
        await navigator.share({
          title: "SocialConnect",
          text: caption || "Check out this post!"
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(
          caption || "Check out this post!"
        );
        showToast("Post text copied!");
      } else {
        showToast("Sharing is not supported by this browser.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Unable to share right now.");
      }
    }
  }

  if (button.classList.contains("more-btn")) {
    showToast("More post options coming soon.");
  }
});

// Add comments to both sample and newly created posts
document.addEventListener("submit", event => {
  if (!event.target.matches(".comment-form")) return;

  event.preventDefault();

  const form = event.target;
  const input = $(".comment-input", form);
  const message = input.value.trim();

  if (!message) {
    showToast("Please type a comment.");
    return;
  }

  const postElement = form.closest(".post-card");
  const comment = $("#profileName").textContent + ": " + message;
  const list = $(".comment-list", form.parentElement);

  const item = document.createElement("p");
  item.textContent = comment;
  list.appendChild(item);

  const count = $(".comment-btn span", postElement);
  count.textContent = Number(count.textContent) + 1;

  const post = findUserPost(postElement.dataset.postId);

  if (post) {
    post.comments.push(comment);
    saveData(STORAGE.posts, userPosts);
  }

  input.value = "";
  showToast("Comment added!");
});

// Search posts and friends
$("#searchInput").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();

  $$(".searchable-post").forEach(post => {
    post.classList.toggle(
      "hidden",
      !post.textContent.toLowerCase().includes(query)
    );
  });

  $$(".story").forEach(story => {
    story.classList.toggle(
      "hidden",
      !story.textContent.toLowerCase().includes(query)
    );
  });

  $$(".message-item").forEach(item => {
    item.classList.toggle(
      "hidden",
      !item.textContent.toLowerCase().includes(query)
    );
  });
});

// Message search
$("#messageSearch").addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();

  $$(".message-item").forEach(item => {
    item.classList.toggle(
      "hidden",
      !item.textContent.toLowerCase().includes(query)
    );
  });
});

// Theme selection
$$(".theme-choice").forEach(button => {
  button.addEventListener("click", () => {
    const theme = button.dataset.theme;

    document.body.dataset.theme = theme;
    saveData(STORAGE.theme, theme);

    $$(".theme-choice").forEach(item => {
      item.classList.toggle("selected", item === button);
    });

    showToast(theme.charAt(0).toUpperCase() + theme.slice(1) + " theme applied!");
  });
});

// Accent color
$$(".color-choice").forEach(button => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;

    document.documentElement.style.setProperty("--accent", color);

    // A soft color background for selected elements.
    document.documentElement.style.setProperty(
      "--accent-soft",
      color + "22"
    );

    saveData(STORAGE.accent, color);

    $$(".color-choice").forEach(item => {
      item.classList.toggle("selected", item === button);
    });
  });
});

// Font size
$("#fontSize").addEventListener("input", function () {
  document.body.style.fontSize = this.value + "px";
  $("#fontValue").textContent = this.value + "px";
  saveData(STORAGE.font, Number(this.value));
});

// Restore theme preferences
const savedTheme = readData(STORAGE.theme, "light");
document.body.dataset.theme = savedTheme;

$$(".theme-choice").forEach(button => {
  button.classList.toggle(
    "selected",
    button.dataset.theme === savedTheme
  );
});

const savedAccent = readData(STORAGE.accent, "#5925ee");
document.documentElement.style.setProperty("--accent", savedAccent);
document.documentElement.style.setProperty("--accent-soft", savedAccent + "22");

$$(".color-choice").forEach(button => {
  button.classList.toggle(
    "selected",
    button.dataset.color === savedAccent
  );
});

const savedFont = readData(STORAGE.font, 16);
document.body.style.fontSize = savedFont + "px";
$("#fontSize").value = savedFont;
$("#fontValue").textContent = savedFont + "px";

// Customize panel
$("#customizeBtn").addEventListener("click", () => {
  $("#customize").scrollIntoView({
    behavior: "smooth",
    block: "center"
  });
});

$("#closeCustomize").addEventListener("click", () => {
  $("#customize").classList.toggle("hidden");

  showToast(
    $("#customize").classList.contains("hidden")
      ? "Customization hidden."
      : "Customization opened."
  );
});

// Stories: click a friend's story
$$(".story[data-story]").forEach(story => {
  story.addEventListener("click", () => {
    showToast(story.dataset.story + "'s story selected!");
  });
});

// Upload a photo as your story
$("#addStory").addEventListener("click", () => {
  const picker = document.createElement("input");
  picker.type = "file";
  picker.accept = "image/*,video/*";

  picker.addEventListener("change", () => {
    const file = picker.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("Choose a story file smaller than 5 MB.");
      return;
    }

    const url = URL.createObjectURL(file);
    const ring = $("#addStory .story-ring");
    ring.replaceChildren();

    const media = document.createElement("img");
    media.src = url;
    media.alt = "Your new story";
    ring.appendChild(media);

    showToast("Your story preview was added!");
  });

  picker.click();
});

// Messages
let selectedFriend = "";

function getChats() {
  return readData(STORAGE.chats, {});
}

function renderChat() {
  const chats = getChats();
  const messages = chats[selectedFriend] || [];
  const container = $("#chatMessages");

  container.replaceChildren();

  messages.forEach(message => {
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble " +
      (message.sender === "You" ? "sent" : "");

    bubble.textContent = message.sender + ": " + message.text;
    container.appendChild(bubble);
  });

  container.scrollTop = container.scrollHeight;
}

function openChat(friend) {
  selectedFriend = friend;

  $("#chatTitle").textContent = "Chat with " + friend;
  $("#chatBox").classList.remove("hidden");

  $$(".message-item").forEach(item => {
    item.classList.toggle(
      "selected",
      item.dataset.name === friend
    );
  });

  renderChat();
  $("#chatInput").focus();
}

$$(".message-item").forEach(item => {
  item.addEventListener("click", () => {
    openChat(item.dataset.name);
  });
});

// Send message in this browser's demo chat
$("#chatForm").addEventListener("submit", event => {
  event.preventDefault();

  const input = $("#chatInput");
  const text = input.value.trim();

  if (!text || !selectedFriend) {
    showToast("Choose a friend and type a message.");
    return;
  }

  const chats = getChats();

  if (!Array.isArray(chats[selectedFriend])) {
    chats[selectedFriend] = [];
  }

  chats[selectedFriend].push({
    sender: "You",
    text,
    time: new Date().toISOString()
  });

  if (!saveData(STORAGE.chats, chats)) return;

  input.value = "";
  renderChat();

  const friendItem = $(
    `.message-item[data-name="${CSS.escape(selectedFriend)}"]`
  );

  if (friendItem) {
    $("small", friendItem).textContent = "You: " + text;
  }

  showToast("Message sent in your demo chat!");
});

// Close chat
$("#closeChat").addEventListener("click", () => {
  $("#chatBox").classList.add("hidden");
});

// Start a new conversation with an existing friend
$("#newMessage").addEventListener("click", () => {
  const name = prompt(
    "Enter a friend's name: Deepu, Nagur, Amyee, Madhavi, Mydhili or Sudarshan"
  );

  if (!name || !name.trim()) return;

  const friend = $$(".message-item").find(item =>
    item.dataset.name.toLowerCase() === name.trim().toLowerCase()
  );

  if (!friend) {
    showToast("Choose a friend already listed in Messages.");
    return;
  }

  openChat(friend.dataset.name);
  $("#chatBox").scrollIntoView({ behavior: "smooth", block: "center" });
});

// Message tabs
$$(".message-tabs button").forEach(button => {
  button.addEventListener("click", () => {
    $$(".message-tabs button").forEach(tab => {
      tab.classList.toggle("selected", tab === button);
    });

    // Demo tabs share the same list of sample conversations.
    showToast(button.dataset.tab + " messages selected.");
  });
});

// Navigation feedback for demo-only sections
$$(".nav-link").forEach(link => {
  link.addEventListener("click", () => {
    $$(".nav-link").forEach(item => {
      item.classList.toggle("active", item === link);
    });

    const target = link.getAttribute("href");

    if (target === "#bookmarks") {
      showToast("Use bookmark icons to save posts.");
    }

    if (target === "#analytics") {
      showToast("Demo analytics: likes and comments appear on posts.");
    }

    if (target === "#notifications") {
      showToast("You have 3 demo notifications.");
    }

    if (target === "#settings") {
      $("#customize").scrollIntoView({ behavior: "smooth" });
    }
  });
});

console.log("SocialConnect loaded successfully!");
