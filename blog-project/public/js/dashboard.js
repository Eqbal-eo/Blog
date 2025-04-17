app.get('/dashboard', (req, res) => {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    res.send(`أهلاً ${req.session.user.username}! لقد سجلت الدخول بنجاح 🎉`);
  });