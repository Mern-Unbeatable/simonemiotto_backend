const packageParseMiddleware = () => {
  return (req, res, next) => {
    try {
      if (typeof req.body.education === 'string')
        req.body.education = JSON.parse(req.body.education);
      if (typeof req.body.areasExpertise === 'string')
        req.body.areasExpertise = JSON.parse(req.body.areasExpertise);
      if (typeof req.body.certifications === 'string')
        req.body.certifications = JSON.parse(req.body.certifications);
      if (typeof req.body.procedures === 'string')
        req.body.procedures = JSON.parse(req.body.procedures);
      if (req.body.experienceYears)
        req.body.experienceYears = parseInt(req.body.experienceYears, 10);

      next();
    } catch (error) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid JSON string format provided within multi-part form parameters.',
      });
    }
  };
};

module.exports = packageParseMiddleware;
