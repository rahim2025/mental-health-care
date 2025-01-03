const express = require('express');
const router = express.Router();
const Resource = require('../models/resource');
const { checkAuth } = require('../middleware/auth');

// GET - View all resources
router.get("/admin/resources",checkAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {           
      return res.render("not-admin");
    }

    const resources = await Resource.find().populate('sourceAdminId', 'name email');
    res.render('resources', {
      title: 'All Resources',
      resources,
      error: null
    });
  } catch (error) {
    console.error('Resources fetch error:', error);
    res.status(500).render('error', { error: 'Error loading resources' });
  }
});

// GET - Create resource form
router.get("/admin/resource/create",checkAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {            
      return res.render("not-admin");
    }
    res.render('create-resource', {
      title: 'Create Resource',
      error: null
    });
  } catch (error) {
    console.error('Create resource form error:', error);
    res.status(500).render('error', { error: 'Error loading create resource form' });
  }
});

// POST - Create new resource
router.post("/admin/resource/create",checkAuth, async (req, res) => {
  try {
    if (!req.user.isAdmin) {           
      return res.render("not-admin");
    }

    const { resourceContext, resourceUrl } = req.body;
    const resource = await Resource.create({
      resourceContext,
      resourceUrl,
      sourceAdminId: req.user._id,
    });

    res.redirect('/api/v1/admin/resources');
  } catch (error) {
    console.error('Create resource error:', error);
    res.render('create-resource', {
      title: 'Create Resource',
      error: error.message
    });
  }
});

// GET - Edit resource form
router.get("/admin/resource/:resourceId/edit",checkAuth, async (req, res) => {
  try {
    if (!req.isAdmin) {        
      return res.render("not-admin");
    }

    const { resourceId } = req.params;
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return res.status(404).render('error', { error: 'Resource not found' });
    }

    res.render('edit-resource', {
      title: 'Edit Resource',
      resource,
      error: null
    });
  } catch (error) {
    console.error('Edit resource form error:', error);
    res.status(500).render('error', { error: 'Error loading edit resource form' });
  }
});

// PUT - Edit single resource
router.put("/admin/resource/:resourceId/edit", checkAuth,async (req, res) => {
  try {
    if (!req.user.isAdmin) {     // Commented out to allow for testing without admin
      return res.render("not-admin");
    }

    const { resourceId } = req.params;
    const { resourceContext, resourceUrl } = req.body;

    await Resource.findByIdAndUpdate(resourceId, {
      resourceContext,
      resourceUrl
    }, { new: true });

    res.redirect('/api/v1/admin/resources');
  } catch (error) {
    console.error('Edit resource error:', error);
    res.status(500).render('error', { error: 'Error editing resource' });
  }
});

module.exports = router;