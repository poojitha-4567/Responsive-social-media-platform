const themeBtn = document.getElementById("themeBtn");
const searchInput = document.getElementById("searchInput");
const postText = document.getElementById("postText");
const mediaInput = document.getElementById("mediaInput");
const uploadPreview = document.getElementById("uploadPreview");
const fileName = document.getElementById("fileName");
const postBtn = document.getElementById("postBtn");
const feed = document.getElementById("feed");
const toast = document.getElementById("toast");

let selectedFile = null;
let previewUrl = null;
let toastTimer;

// Show a small message on the screen.
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// Theme settings
const savedTheme = localStorage.getItem("sc-theme");
const savedColor = localStorage.getItem("sc-color");

if (savedTheme === "dark") {
  document.body.classList.add("dark-theme");
  themeBtn.textContent = "☀️";
}

if (savedColor) {
  document.documentElement.style.setProperty("--primary", savedColor);
}

themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");

  const darkMode = document.body.classList.contains("dark-theme");
  themeBtn.textContent = darkMode ? "☀️" : "🌙";
  localStorage.setItem("sc-theme", darkMode ? "dark" : "light");
});

document.querySelectorAll(".color-dot").forEach((button) => {
  button.addEventListener("click", () => {
    const color = button.dataset.color;

    document.documentElement.style.setProperty("--primary", color);
    localStorage.setItem("sc-color", color);

    showToast("Theme colour updated! 🎨");
  });
});

// Select a photo or video and show a preview.
mediaInput.addEventListener("change", () => {
  selectedFile = mediaInput.files[0] || null;

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  uploadPreview.innerHTML = "";
  uploadPreview.classList.remove("visible");

  if (!selectedFile) {
    fileName.textContent = "No file selected";
    return;
  }

  if (
    !selectedFile.type.startsWith("image/") &&
    !selectedFile.type.startsWith("video/")
  ) {
    showToast("Please select an image or video.");
    mediaInput.value = "";
    selectedFile = null;
    fileName.textContent = "No file selected";
    return;
  }

  fileName.textContent = selectedFile.name;
  previewUrl = URL.createObjectURL(selectedFile);

  let preview;

  if (selectedFile.type.startsWith("image/")) {
    preview = document.createElement("img");
    preview.alt = "Selected photo preview";
  } else {
    preview = document.createElement("video");
    preview.controls = true;
    preview.muted = true;
  }

  preview.src = previewUrl;
  uploadPreview.appendChild(preview);
  uploadPreview.classList.add("visible");
});

// Create a new post card.
function createPost() {
  const caption = postText.value.trim();

  if (!caption && !selectedFile) {
    showToast("Please write something or select a photo/video.");
    return;
  }

  const card = document.createElement("article");
  card.className = "post-card";

  const header = document.createElement("div");
  header.className = "post-header";

  const avatar = document.createElement("img");
  avatar.className = "avatar";
  avatar.src =
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop";
  avatar.alt = "Poojitha";

  const userInfo = document.createElement("div");
  userInfo.className = "post-user";

  const username = document.createElement("strong");
  username.textContent = "Poojitha";

  const time = document.createElement("span");
  time.textContent = "Just now";

  userInfo.append(username, time);
  header.append(avatar, userInfo);

  const more = document.createElement("button");
  more.className = "more-btn";
  more.textContent = "•••";
  more.setAttribute("aria-label", "More options");
  header.appendChild(more);

  card.appendChild(header);

  if (caption) {
    const captionElement = document.createElement("p");
    captionElement.className = "post-caption";
    captionElement.textContent = caption;
    card.appendChild(captionElement);
  }

  if (selectedFile && previewUrl) {
    const mediaUrl = previewUrl;
    const mediaType = selectedFile.type;

    const media = document.createElement(
      mediaType.startsWith("video/") ? "video" : "img"
    );

    media.className = "post-media";
    media.src = mediaUrl;

    if (mediaType.startsWith("video/")) {
      media.controls = true;
    } else {
      media.alt = "Photo posted by Poojitha";
    }

    card.appendChild(media);

    // Keep this URL alive while the post uses it.
    previewUrl = null;
  }

  const stats = document.createElement("div");
  stats.className = "post-stats";

  const likeCount = document.createElement("span");
  likeCount.className = "like-count";
  likeCount.textContent = "0 likes";

  const commentCount = document.createElement("span");
  commentCount.textContent = "0 comments";

  stats.append(likeCount, commentCount);
  card.appendChild(stats);

  const actions = document.createElement("div");
  actions.className = "post-actions";
  actions.innerHTML = `
    <button class="like-btn">♡ Like</button>
    <button class="comment-btn">💬 Comment</button>
    <button class="share-btn">↗ Share</button>
  `;
  card.appendChild(actions);

  const commentArea = document.createElement("div");
  commentArea.className = "comment-area";
  commentArea.innerHTML = `
    <div class="comment-list"></div>
    <form class="comment-form">
      <input type="text" placeholder="Write a comment..." aria-label="Write a comment">
      <button type="submit">Post</button>
    </form>
  `;
  card.appendChild(commentArea);

  // Add the new post under the Latest posts heading.
  const feedHeading = feed.querySelector(".feed-title");

  if (feedHeading) {
    feedHeading.after(card);
  } else {
    feed.prepend(card);
  }

  postText.value = "";
  selectedFile = null;
  mediaInput.value = "";
  uploadPreview.innerHTML = "";
  uploadPreview.classList.remove("visible");
  fileName.textContent = "No file selected";

  showToast("Your post has been shared! 🎉");
}

postBtn.addEventListener("click", createPost);

// Handle likes, comments and sharing for existing and new posts.
feed.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const card = button.closest(".post-card");
  if (!card) return;

  if (button.classList.contains("like-btn")) {
    const liked = button.classList.toggle("liked");
    button.textContent = liked ? "♥ Liked" : "♡ Like";

    const countElement = card.querySelector(".like-count");
    const currentCount = parseInt(countElement.textContent, 10) || 0;
    const newCount = Math.max(0, currentCount + (liked ? 1 : -1));

    countElement.textContent = `${newCount} likes`;
  }

  if (button.classList.contains("comment-btn")) {
    const input = card.querySelector(".comment-form input");
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (button.classList.contains("share-btn")) {
    const caption = card.querySelector(".post-caption")?.textContent || "";
    const shareText = `SocialConnect post by ${card.querySelector(".post-user strong")?.textContent || "a friend"}: ${caption}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: "SocialConnect", text: shareText });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(shareText);
        showToast("Post text copied! You can share it.");
      } else {
        showToast("Sharing is available from a secure website.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Unable to share right now.");
      }
    }
  }
});

// Handle comment submissions for all posts.
feed.addEventListener("submit", (event) => {
  if (!event.target.classList.contains("comment-form")) return;

  event.preventDefault();

  const form = event.target;
  const input = form.querySelector("input");
  const commentText = input.value.trim();

  if (!commentText) return;

  const card = form.closest(".post-card");
  const commentList = card.querySelector(".comment-list");
  const comment = document.createElement("div");
  comment.className = "comment";

  const name = document.createElement("strong");
  name.textContent = "Poojitha";

  const message = document.createElement("span");
  message.textContent = commentText;

  comment.append(name, message);
  commentList.appendChild(comment);

  input.value = "";

  const stats = card.querySelector(".post-stats span:last-child");
  const commentCount = commentList.querySelectorAll(".comment").length;
  stats.textContent = `${commentCount} comments`;

  showToast("Comment added! 💬");
});

// Search posts by their text or author's name.
searchInput.addEventListener("input", () => {
  const searchTerm = searchInput.value.toLowerCase().trim();
  const cards = feed.querySelectorAll(".post-card");

  cards.forEach((card) => {
    const searchableText = (
      card.innerText + " " + (card.dataset.search || "")
    ).toLowerCase();

    card.style.display = searchableText.includes(searchTerm) ? "" : "none";
  });
});

// Story buttons.
document.querySelectorAll(".story-item").forEach((story) => {
  story.addEventListener("click", () => {
    const name = story.dataset.story;

    if (name === "Poojitha") {
      document.getElementById("create").scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      mediaInput.click();
    } else {
      showToast(`${name}'s story selected!`);
    }
  });
});

// Update navigation highlighting when a navigation link is clicked.
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((item) => {
      item.classList.remove("active");
    });

    link.classList.add("active");
  });
});

console.log("SocialConnect is ready!");