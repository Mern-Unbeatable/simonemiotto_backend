class filterSurgeonDTO {
  constructor(query = {}) {
    this.page = parseInt(query.page) || 1;
    this.limit = parseInt(query.limit) || 10;
    this.sortBy = query.sortBy || 'createdAt';
    this.sortOrder = query.sortOrder || 'desc';
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
