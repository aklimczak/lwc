import { LightningElement, wire, track, api } from 'lwc';
import { publish, MessageContext } from 'lightning/messageService';
import BOATMC from '@salesforce/messageChannel/BoatMessageChannel__c';
import getBoats from '@salesforce/apex/BoatDataService.getBoats';
import updateBoatList from '@salesforce/apex/BoatDataService.updateBoatList';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import {refreshApex} from '@salesforce/apex';

// ...
const SUCCESS_TITLE = 'Success';
const MESSAGE_SHIP_IT = 'Ship it!';
const SUCCESS_VARIANT = 'success';
const ERROR_TITLE = 'Error';
const ERROR_VARIANT = 'error';
const COLUMNS = [
    {label: 'Name', fieldName: 'Name', type: 'text', editable: true},
    {label: 'Length', fieldName: 'Length__c', type: 'number', editable: true},
    {label: 'Price', fieldName: 'Price__c', type: 'currency', editable: true},
    {label: 'Description', fieldName: 'Description__c', type: 'text', editable: true}
];

export default class BoatSearchResults extends LightningElement {
  @track selectedBoatId;
  columns = COLUMNS;
  boatTypeId = '';
  @track boats;
  isLoading = false;
  @track draftValues = [];
  // wired message context
  @wire(MessageContext)
  messageContext;
  // wired getBoats method 
  @wire(getBoats, {boatTypeId: '$boatTypeId'})
  wiredBoats(result) {
      this.boats = result;
   }
  
  // public function that updates the existing boatTypeId property
  // uses notifyLoading
  @api searchBoats(boatTypeId) {
      this.boatTypeId = boatTypeId;
      this.notifyLoading();
   }
  
  // this public function must refresh the boats asynchronously
  // uses notifyLoading
  @api async refresh() {
    this.notifyLoading();
    await refreshApex(this.boats);
   }
  
  // this function must update selectedBoatId and call sendMessageService
  updateSelectedTile(event) {
      this.selectedBoatId = event.detail.boatId;
      this.sendMessageService(this.selectedBoatId);
   }
  
  // Publishes the selected boat Id on the BoatMC.
  sendMessageService(boatId) { 
    // explicitly pass boatId to the parameter recordId
    const payload = { recordId: boatId};
    publish(this.messageContext, BOATMC, payload);
  }
  
  // The handleSave method must save the changes in the Boat Editor
  // passing the updated fields from draftValues to the 
  // Apex method updateBoatList(Object data).
  // Show a toast message with the title
  // clear lightning-datatable draft values
  handleSave(event) {
    // notify loading
    this.isLoading = true;
    this.notifyLoading(this.isLoading);

    const updatedFields = event.detail.draftValues;
    // Update the records via Apex
    updateBoatList({data: updatedFields})
    .then(() => {
        const successEvent = new ShowToastEvent({
            title: SUCCESS_TITLE,
            message: MESSAGE_SHIP_IT,
            variant: SUCCESS_VARIANT
        });
        this.dispatchEvent(successEvent);
        this.refresh();
        this.draftValues = [];
    })
    .catch(error => {
        const errorEvent = new ShowToastEvent({
            title: ERROR_TITLE,
            message: error.body.message,
            variant: ERROR_VARIANT
        });
        this.dispatchEvent(errorEvent);
    })
    .finally(() => {
        this.isLoading = false;
        this.notifyLoading(this.isLoading);
    });
  }
  // Check the current value of isLoading before dispatching the doneloading or loading custom event
  notifyLoading(isLoading) {
        if(isLoading){
            this.dispatchEvent(new CustomEvent('loading'));
        }else{
            this.dispatchEvent(new CustomEvent('doneloading'));
        }
   }
}
