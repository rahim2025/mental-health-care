const express = require("express");
const { Types } = require("mongoose");
const router = express.Router();
const User = require("../models/users.js");
const Post = require("../models/post");
const Comment = require("../models/comment");
const { checkAuth } = require('../middleware/auth');

// GET - View all posts
router.get("/allPost", checkAuth, async (req, res) => {
    try {
        // Fetch posts with author information
        const posts = await Post.find()
            .populate('authorId', 'name email')
            .sort({ createdAt: -1 });

        // Fetch comments for all posts
        const postsWithComments = await Promise.all(posts.map(async (post) => {
            const comments = await Comment.find({ parentPostId: post._id })
                .populate('authorId', 'name email')
                .sort({ createdAt: -1 });
            
            return {
                ...post.toObject(),
                comments: comments
            };
        }));

        res.render('posts', {
            title: 'All Posts',
            posts: postsWithComments,
            currentUser: req.user,
            error: null
        });
    } catch (error) {
        console.error('Posts fetch error:', error);
        res.status(500).render('error', { error: 'Error loading posts' });
    }
});

// GET - Create post form
router.get("/post/create", checkAuth, async (req, res) => {
    try {

        res.render('create-post', {
            title: 'Create Post',
            error: null
        });
    } catch (error) {
        console.error('Create post form error:', error);
        res.status(500).render('error', { error: 'Error loading create post form' });
    }
});

// POST - Create new post
router.post("/post/create",checkAuth, async (req, res) => {
    try {

        const { text } = req.body;
        const post = new Post({
            text,
            authorId: req.user._id
        });
        await post.save();
        res.redirect('/api/v1/allPost');
    } catch (error) {
        console.error('Create post error:', error);
        res.render('create-post', {
            title: 'Create Post',
            error: error.message
        });
    }
});

// GET - View single post with comments
router.get("/post/:postId", checkAuth, async (req, res) => {
    try {
  

        const { postId } = req.params;

        const post = await Post.findById(postId).populate('authorId', 'name email');
        if (!post) {
            return res.status(404).render('error', { error: 'Post not found' });
        }

        const comments = await Comment.find({ parentPostId: post._id })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.render('post', {
            title: 'Post Detail',
            post: post,
            comments: comments,
            currentUser: req.session.userId,
            error: null
        });

    } catch (error) {
        console.error('Post view error:', error);
        res.status(500).render('error', {
            error: 'Error loading post'
        });
    }
});

// POST - Create new comment
router.post("/comment/create", checkAuth, async (req, res) => {
   
    try {
        const { text, postId } = req.body;
        const comment = new Comment({
            text,
            authorId: req.user._id,
            parentPostId: postId
        });
        await comment.save();
        res.redirect('/api/v1/allPost');
        // res.redirect(`/api/v1/post/${postId}`);
    } catch (error) {
        console.error('Create comment error:', error);
        res.status(500).render('error', { error: 'Error creating comment' });
    }
});

// update post text
router.put("/post/:postId/update", checkAuth, async (req, res) => {
    console.log("update post");
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
        return res.status(404).json({ message: "Post not found" });
    }

    // users can only edit their own posts
    if (post.authorId.toString() !== req.user._id.toString()) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { text } = req.body;
    console.log("text", text);

    await Post.findOneAndUpdate(
        {
            _id: new Types.ObjectId(postId),
        },
        { $set: { text } },
        { new: true }
    );

    res.redirect('/api/v1/allPost');
});
  
  // delete post
  router.delete("/post/:postId/delete",checkAuth,  async (req, res) => {
    console.log("delete post");
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const { postId } = req.params;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
  
    // users can only delete their own posts
    if (post.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    await Post.deleteOne({ _id: post._id });
  
    res.redirect('/api/v1/allPost');
  });
  

  // edit single comment
  router.put("/post/:postId/comment/:commentId/edit",checkAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const { postId, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
  
    // users can only edit their own comments
    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const { text } = req.body;
    const updatedComment = await Comment.findOneAndUpdate(
      {
        _id: comment._id,
        parentPostId: new Types.ObjectId(postId),
      },
      { $set: { text } },
      { new: true }
    );
  
    res.redirect(`/api/v1/allPost`);
  });
  
  // delete single comment
  router.delete("/post/:postId/comment/:commentId/delete",checkAuth, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    const { postId, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }
  
    // users can only edit their own comments
    if (comment.authorId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  
    await Comment.deleteOne({
      _id: comment._id,
      parentPostId: new Types.ObjectId(postId),
    });
  
    res.redirect("/api/v1/allPost");
  });

module.exports = router;