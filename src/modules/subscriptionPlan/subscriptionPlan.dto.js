class CreateSubscriptionPlanDTO {
  constructor(data) {
    this.planName = data.planName;
    this.sortDescription = data.sortDescription;
    this.priceMonthly = data.priceMonthly;
    this.portfolioLimit = data.portfolioLimit;
    this.featuresAllowed = data.featuresAllowed;
    this.validFor = data.validFor;
  }

  toDatabase() {
    return {
      planName: this.planName,
      sortDescription: this.sortDescription,
      priceMonthly: this.priceMonthly,
      portfolioLimit: this.portfolioLimit,
      featuresAllowed: this.featuresAllowed,
      validFor: this.validFor,
    };
  }
}

class UpdateSubscriptionPlanDTO {
  constructor(data) {
    this.planName = data.planName;
    this.sortDescription = data.sortDescription;
    this.priceMonthly = data.priceMonthly;
    this.portfolioLimit = data.portfolioLimit;
    this.featuresAllowed = data.featuresAllowed;
    this.validFor = data.validFor;
  }

  toDatabase() {
    const updateData = {};

    if (this.planName !== undefined) updateData.planName = this.planName;
    if (this.sortDescription !== undefined)
      updateData.sortDescription = this.sortDescription;
    if (this.priceMonthly !== undefined)
      updateData.priceMonthly = this.priceMonthly;
    if (this.portfolioLimit !== undefined)
      updateData.portfolioLimit = this.portfolioLimit;
    if (this.featuresAllowed !== undefined)
      updateData.featuresAllowed = this.featuresAllowed;
    if (this.validFor !== undefined) updateData.validFor = this.validFor;

    return updateData;
  }
}

module.exports = {
  CreateSubscriptionPlanDTO,
  UpdateSubscriptionPlanDTO,
};
