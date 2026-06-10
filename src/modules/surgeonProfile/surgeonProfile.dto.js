class filterSurgeonDTO {
  constructor(query = {}) {
    this.page = parseInt(query.page) || 1;
    this.limit = parseInt(query.limit) || 10;
    // Support common query key variants from clients.
    this.sortBy = query.sortBy || query.sortby || 'createdAt';
    this.sortOrder = query.sortOrder || query.sortorder || 'desc';
    this.search = query.search;
    this.city = query.city;
    this.specialization = query.specialization;
    this.clinic = query.clinic;
    this.status = query.status;
    this.paymentStatus = query.paymentStatus;
  }

  /**
   * Get pagination offset
   */
  getOffset() {
    return (this.page - 1) * this.limit;
  }
}

module.exports = {
  filterSurgeonDTO,
};
