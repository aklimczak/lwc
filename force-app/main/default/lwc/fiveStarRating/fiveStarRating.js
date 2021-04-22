//import fivestar static resource, call it fivestar
import { LightningElement, api } from 'lwc';
import { loadStyle, loadScript } from 'lightning/platformResourceLoader';
import fivestar from '@salesforce/resourceUrl/fivestar';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
// add constants here
const ERROR_VARIANT = 'error';
const ERROR_TITLE = 'Error loading five-star';
const READ_ONLY_CLASS = 'readonly c-rating';
const EDITABLE_CLASS = 'c-rating';

export default class FiveStarRating extends LightningElement {
  //initialize public readOnly and value properties
  @api readOnly;
  @api value;

  editedValue;
  isRendered;

  //getter function that returns the correct class depending on if it is readonly
  get starClass() {
    return this.readOnly ? READ_ONLY_CLASS : EDITABLE_CLASS; 
  }
  

  // Render callback to load the script once the component renders.
  renderedCallback() {
    window.addEventListener('addReviewOpenEvent', this.refreshStars);
    if (this.isRendered) {
      return;
    }
    this.loadScript();
    this.isRendered = true;
  }

  refreshStars = () => {
    let stars = document.querySelectorAll(".addreview li.c-rating__item");
    stars.forEach(function(star) {
        star.classList.remove('is-active');
    });
  };

  //Method to load the 3rd party script and initialize the rating.
  //call the initializeRating function after scripts are loaded
  //display a toast with error message if there is an error loading script

  loadScript() {
    Promise.all([
      loadScript(this, fivestar + '/rating.js'),
      loadStyle(this, fivestar + '/rating.css')
    ])
    .then(()=>{
      this.initializeRating(this.value);
    })
    .catch(error => {
      this.dispatchEvent(
        new ShowToastEvent({
          title: ERROR_TITLE,
          variant: ERROR_VARIANT,
          message: error.body.message
        })
      )
    });
  }

  initializeRating(currentRating) {
    let domEl = this.template.querySelector('ul');
    let maxRating = 5;
    let self = this;
    let callback = function (rating) {
      self.editedValue = rating;
      self.ratingChanged(rating);
    };
    this.ratingObj = window.rating(
      domEl,
      //this.value,
      currentRating,
      maxRating,
      callback,
      this.readOnly
    );
  }

  // Method to fire event called ratingchange with the following parameter:
  // {detail: { rating: CURRENT_RATING }}); when the user selects a rating
  ratingChanged(rating) {
    this.dispatchEvent(new CustomEvent('ratingchange',{
      detail: {
        rating: rating
      }
    }));
  }
}