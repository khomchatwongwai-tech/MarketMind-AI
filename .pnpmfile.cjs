module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies.jose) {
        pkg.dependencies.jose = '5.10.0';
      }
      return pkg;
    }
  }
};
