const express = require("express");
const mongoose = require("mongoose");
const { Types } = require("mongoose");

const Complaint = require("../models/complaint");
const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/users");
const { route } = require("./indexRoutes");

const router = express.Router();

// no middleware has been used since i dont see any middleware
// setting up authentication wasnt my job so i left it as is
// in an ideal world, there should be an authenticator middleware
// with 2 layers of authentication. they should decode the token
// and put populate req.user or req.admin where relevant.

// submit single complaints from user.
// post/comment id should be sent in url query
// i.e. "/complain/submit?postId=<sourcePostId>" or "/complain/submit?commentId=<sourceCommentId>"
router.get("/complaint/submit", async (req, res) => {
  try {
      // Check if user is logged in via session
      // if (!req.session.userId) {
      //     return res.redirect('/auth/login');
      // }

      // Render the complaint submission form
      res.render('complaint-form', {
          title: 'Submit Complaint',
          error: null,
          user: req.session.userId
      });
      
  } catch (error) {
      console.error('Error rendering complaint form:', error);
      res.status(500).render('error', {
          error: 'Unable to load complaint form'
      });
  }
});

router.post("/complaint/submit", async (req, res) => {
  const { postId, commentId } = req.query;

  if (postId && !mongoose.isValidObjectId(postId)) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
  if (commentId && !mongoose.isValidObjectId(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  // Proceed with database queries if IDs are valid
  let source;
  if (postId) {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Source post not found" });
    }
    source = { source: "post", sourcePostId: post._id, complaineeId: post.authorId };
  } else if (commentId) {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Source comment not found" });
    }
    source = { source: "comment", sourceCommentId: comment._id, complaineeId: comment.authorId };
  }

  // Continue with complaint creation
  const { complaintText } = req.body;
  const { _id: complainerId } = req.user;
  await Complaint.create({ complaintText, complainerId, ...source });

  res.json({ message: "success" });
});


// see all complaints in admin
// no pagination as of now
router.get("/admin/complaint/all", async (req, res) => {
  // if (!req.admin) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  const complaints = await Complaint.find();

  // Render EJS view with complaints data
  res.render("complaints", { complaints, count: complaints.length });
});

// get single complaint in admin
// returns complaint with all sources included
router.get("/admin/complaint/indivisualComplain", async (req, res) => {
  res.render("indivisualComplain");
});


router.get("/admin/complaint/complaintId", async (req, res) => {
  // if (!req.admin) {
  //   return res.status(401).json({ message: "Unauthorized" });
  // }

  const { complaintId } = req.query;

  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  const { sourcePostId, sourceCommentId, complainerId, complaineeId, ...rest } =
    complaint;

  let sourcePost;
  let relevantComments;

  let sourceComment;
  let relevantPost;
  if (sourcePostId) {
    sourcePost = await Post.findById(sourcePostId);
    if (!sourcePost) {
      return res.status(400).json({ message: "Source post not found" });
    }

    relevantComments = await Comment.find({
      parentPostId: new Types.ObjectId(sourcePostId),
    });
  } else if (sourceCommentId) {
    sourceComment = await Comment.findById(sourceCommentId);
    if (!sourceComment) {
      return res.status(400).json({ message: "Source comment not found" });
    }

    relevantPost = await Post.findById({ _id: sourceComment.parentPostId });
  }

  const complainer = await User.findById(complainerId);
  const complainee = await User.findById(complaineeId);

  res.json({
    ...rest,
    sourcePost,
    relevantComments,
    sourceComment,
    relevantPost,
    complainer,
    complainee,
  });
});

// submit review on single complaint in admin
router.put("/admin/complaint/:complaintId/review/submit", async (req, res) => {
  if (!req.admin) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { complaintId } = req.params;
  const { reviewResponse, isValidComplaint } = req.body;

  if (isValidComplaint === undefined) {
    return res.status(400).json({ message: "Invalid response" });
  }

  const updatedComplaint = await Complaint.findOneAndUpdate(
    {
      _id: new Types.ObjectId(complaintId),
    },
    {
      isReviewed: true,
      reviewerId: req.admin._id,
      reviewResponse,
      isValidComplaint,
    },
    { new: true }
  );

  if (!updatedComplaint) {
    return res.status(404).json({ message: "Complaint not found" });
  }

  res.json(updatedComplaint);
});

module.exports = router;