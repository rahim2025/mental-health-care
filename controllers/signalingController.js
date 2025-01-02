exports.getSignalingHealth = (req, res) => {
  res.status(200).json({ success: true, message: 'Signaling server is operational' });
};
