const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

//@route Post api/posts
//@desc Add posts
//@access Private

router.post(
  '/',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      });

      const post = await newPost.save();

      return res.json(post);
    } catch (err) {
      console.log(err.message);
      return res.status(500).send('Server Error');
    }
  }
);

//@route Post api/posts
//@desc Get all posts
//@access Private
router.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 }); //-1 sorts posts to newest to oldest

    return res.json(posts);
  } catch (err) {
    console.log(err.message);
    return res.status(500).send('Server Error');
  }
});

//@route Post api/posts/:id
//@desc Get post by id
//@access Private
router.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    res.json(post);
  } catch (err) {
    console.log(err.message);
    if (err.name === 'CastError') {
      return res.status(404).send({
        msg: 'Post not found',
      });
    }
    return res.status(500).send('Server Error');
  }
});

//@route Delete api/posts/:id
//@desc Delete post by id
//@access Private
router.delete('/:id', auth, async (req, res) => {
  try {
    //check post
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ msg: 'Post not found' });
    }

    //check user
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await post.remove();

    console.log(post, 'Post deleted');

    return res.json({ msg: 'Post deleted' });
  } catch (err) {
    console.log(err.message);
    if (err.name === 'CastError') {
      return res.status(404).send({
        msg: 'Post not found',
      });
    }
    return res.status(500).send('Server Error');
  }
});

//LIKES
//@route PUT api/posts/like/:id
//@desc Like a post
//@access Private

router.put('/like/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has already been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id).length >
      0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }

    post.likes.unshift({ user: req.user.id });

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route PUT api/posts/unlike/:id
//@desc Unlike a post
//@access Private

router.put('/unlike/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    // Check if the post has yet been liked
    if (
      post.likes.filter((like) => like.user.toString() === req.user.id)
        .length === 0
    ) {
      return res.status(400).json({ msg: 'Post has not yet been liked' });
    }

    const removeIndex = post.likes
      .map((like) => like.user.toString())
      .indexOf(req.user.id);

    post.likes.splice(removeIndex, 1);

    await post.save();

    res.json(post.likes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

//@route Post api/posts/comment/:id
//@desc add a comment on a post by passing the post id
//@access Private

router.post(
  '/comment/:id',
  [auth, [check('text', 'Text is required').not().isEmpty()]],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = {
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id,
      };

      post.comments.unshift(newComment);

      await post.save();

      res.json(post.comments);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

//@route Post api/posts/comment/:id/comment_id
//@desc Deleting a comment on a post by passing the post id and the comment id
//@access Private
router.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    //pull out the comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    if (!comment) {
      res.status(404).json({ msg: 'Comment does not exist' });
    }

    // check the user deleting the comment is actually the user that made the comment

    if (comment.user.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ msg: 'You are not authorized to remove comment' });
    }

    const removeIndex = post.comments
      .map((comment) => comment.user.toString())
      .indexOf(req.user.id);

    post.comments.splice(removeIndex, 1);

    await post.save();

    res.json(post.comments);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
