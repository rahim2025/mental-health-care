const express = require("express");
const mongoose = require("mongoose");
const { Types } = require("mongoose");

const Complaint = require("../models/complaint");
const { checkAuth } = require('../middleware/auth');
const Post = require("../models/post");
const Comment = require("../models/comment");
const User = require("../models/users");
const { route } = require("./indexRoutes");

const router = express.Router();



// submit single complaints from user.
// post/comment id should be sent in url query
// i.e. "/complain/submit?postId=<sourcePostId>" or "/complain/submit?commentId=<sourceCommentId>"
router.get("/complaint/submit",checkAuth, async (req, res) => {
  try {
      // Check if user is logged in via session
      if (!req.user) {
          return res.redirect('/auth/login');
      }

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

router.post("/complaint/submit", checkAuth, async (req, res) => {
  try {
    // Check if user is logged in via session
    if (!req.user) {
      return res.redirect('/auth/login');
    }

    const { complainerId, complaineeId, source, sourcePostId, sourceCommentId, complaintText } = req.body;

    // Validate IDs
    if (!mongoose.isValidObjectId(complainerId) || !mongoose.isValidObjectId(complaineeId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    if (source === 'post' && sourcePostId && !mongoose.isValidObjectId(sourcePostId)) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
    if (source === 'comment' && sourceCommentId && !mongoose.isValidObjectId(sourceCommentId)) {
      return res.status(400).json({ message: 'Invalid comment ID' });
    }

    // Proceed with database queries if IDs are valid
    let sourceData;
    if (source === 'post') {
      const post = await Post.findById(sourcePostId);
      if (!post) {
        return res.status(404).json({ message: "Source post not found" });
      }
      sourceData = { source: "post", sourcePostId: post._id, complaineeId: post.authorId };
    } else if (source === 'comment') {
      const comment = await Comment.findById(sourceCommentId);
      if (!comment) {
        return res.status(404).json({ message: "Source comment not found" });
      }
      sourceData = { source: "comment", sourceCommentId: comment._id, complaineeId: comment.authorId };
    }

    // Continue with complaint creation
    await Complaint.create({ complaintText, complainerId, ...sourceData });

    res.json({ message: "success" });
  } catch (error) {
    console.error('Error submitting complaint:', error);
    res.status(500).render('error', {
      error: 'Failed to submit complaint'
    });
  }
});
 


// see all complaints in admin
// no pagination as of now
router.get("/admin/complaint/all",checkAuth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.render("not-admin");
  }

  const complaints = await Complaint.find();

  // Render EJS view with complaints data
  res.render("complaints", { complaints, count: complaints.length });
});

// get single complaint in admin
// returns complaint with all sources included
router.get("/admin/complaint/indivisualComplain",checkAuth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.render("not-admin");
  }
  res.render("indivisualComplain");
});


router.get("/admin/complaint/complaintId",checkAuth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.render("not-admin");
  }

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
  if (!req.user.isAdmin) {
    return res.render("not-admin");
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
