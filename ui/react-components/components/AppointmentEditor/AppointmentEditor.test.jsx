import React from "react";
import AppointmentEditor from "./AppointmentEditor.jsx";
import {renderWithReactIntl} from "../../utils/TestUtil";
import {fireEvent, waitForElement} from "@testing-library/react";
import * as save from "./AppointmentEditorService.js";
import moment from "moment";

jest.mock('../../api/patientApi');
jest.mock('../../api/serviceApi');
jest.mock('../../utils/CookieUtil');
const patientApi = require('../../api/patientApi');
const serviceApi = require('../../api/serviceApi');
let getPatientByLocationSpy;
let getAllServicesSpy;

describe('Appointment Editor', () => {

    beforeEach(() => {
        getPatientByLocationSpy = jest.spyOn(patientApi, 'getPatientsByLocation');
        getAllServicesSpy = jest.spyOn(serviceApi, 'getAllServices');
    });
    afterEach(() => {
        getPatientByLocationSpy.mockRestore();
        getAllServicesSpy.mockRestore();
    });

    it('should render an editor', () => {
        const {container} = renderWithReactIntl(<AppointmentEditor/>);
        expect(container.hasChildNodes()).toBeTruthy();
    });

    it('should have an appointment-editor div', () => {
        const {getByTestId} = renderWithReactIntl(<AppointmentEditor/>);
        expect(getByTestId('appointment-editor')).not.toBeNull();
    });

    it('should display the patient search', () => {
        const {container, getByTestId} = renderWithReactIntl(<AppointmentEditor/>);
        expect(container.querySelector('.searchFieldsContainer')).not.toBeNull();
        expect(getByTestId('asyncSelect')).not.toBeNull();
    });

    it('should display the all components search except speciality', function () {
        const {container, getAllByTestId} = renderWithReactIntl(<AppointmentEditor/>);
        expect(container.querySelector('.searchFieldsContainer')).not.toBeNull();

        expect(container.querySelector('.searchFieldsContainerLeft')).not.toBeNull();
        expect(container.querySelector('.searchFieldsContainerLeft').children.length).toBe(4);
        expect(container.querySelector('.searchFieldsContainerRight')).not.toBeNull();
        expect(container.querySelector('.searchFieldsContainerRight').children.length).toBe(1);
        expect(getAllByTestId('select').length).toBe(4);
    });

    it('should display the all components search', function () {
        const config = {
            "enableSpecialities": "true"
        };
        const {container, getAllByTestId} = renderWithReactIntl(<AppointmentEditor appConfig={config}/>);
        expect(container.querySelector('.searchFieldsContainer')).not.toBeNull();
        expect(container.querySelector('.searchFieldsContainerLeft')).not.toBeNull();
        expect(container.querySelector('.searchFieldsContainerLeft').children.length).toBe(5);
        expect(container.querySelector('.searchFieldsContainerRight')).not.toBeNull();
        expect(container.querySelector('.searchFieldsContainerRight').children.length).toBe(1);
        expect(getAllByTestId('select').length).toBe(5);
    });

    it('should render AppointmentEditorFooter', function () {
        const {getByTestId, container} = renderWithReactIntl(<AppointmentEditor/>);
        expect(container.querySelector('.footer')).not.toBeNull();
        expect(container.querySelector('.footerElements')).not.toBeNull();
        expect(container.querySelector('.footer').children.length).toBe(1);
        expect(container.querySelector('.footerElements').children.length).toBe(2);
    });

    it('should render AppointmentDatePicker', function () {
        const {getByTestId} = renderWithReactIntl(<AppointmentEditor/>);
        expect(getByTestId('datePicker')).not.toBeNull();
    });

    it('should display error message when patient search value is changed and no new value selected', async () => {
        const placeholder = 'placeholder';
        const onChnageSpy = jest.fn();
        const targetPatient = '9DEC74AB 9DEC74B7 (IQ1110)';
        const {container, getByText, querySelector} = renderWithReactIntl(
            <AppointmentEditor />);
        const inputBox = container.querySelector('.react-select__input input');
        fireEvent.change(inputBox, { target: { value: "abc" } });
        await waitForElement(
            () => (container.querySelector('.react-select__menu'))
        );
        const option = getByText(targetPatient);
        fireEvent.click(option);
        let singleValue;
        await waitForElement(
            () =>
                (singleValue = container.querySelector(
                    '.react-select__single-value'
                ))
        );
        fireEvent.change(inputBox, { target: { value: "def" } });
        getByText('Please select patient');
    });

    it('should display error messages when checkAndSave is clicked and required fields are not selected', () => {
        const {getByText, getAllByText} = renderWithReactIntl(<AppointmentEditor/>);
        const button = getByText('Check and Save');
        const saveAppointmentSpy = jest.spyOn(save, 'saveAppointment');
        fireEvent.click(button);
        getByText('Please select patient');
        getByText('Please select service');
        getByText('Please select date');
        const timeError = getAllByText('Please select time');
        expect(timeError.length).toBe(2);
        expect(saveAppointmentSpy).not.toHaveBeenCalled();
    });

    it('should display time error message when time is not selected and remaining fields are selected ', async () => {
        const {container, getByText, queryByText, getAllByTitle, getAllByText} = renderWithReactIntl(<AppointmentEditor/>);

        //select patient
        const targetPatient = '9DEC74AB 9DEC74B7 (IQ1110)';
        const inputBox = container.querySelector('.react-select__input input');
        fireEvent.change(inputBox, { target: { value: "abc" } });
        await waitForElement(
            () => (container.querySelector('.react-select__menu'))
        );
        const option = getByText(targetPatient);
        fireEvent.click(option);
        let singleValue;
        await waitForElement(
            () =>
                (singleValue = container.querySelector(
                    '.react-select__single-value'
                ))
        );

        //select service
        const targetService = 'Physiotherapy OPD';
        const inputBoxService = container.querySelectorAll('.react-select__input input')[1];
        fireEvent.change(inputBoxService, { target: { value: "Phy" } });
        await waitForElement(() => (container.querySelector('.react-select__menu')));
        const optionService = getByText(targetService);
        fireEvent.click(optionService);
        let singleValueService;
        await waitForElement(
            () =>
                (singleValueService = container.querySelector(
                    '.react-select__single-value'
                ))
        );

        //select date
        const getCellByTitle = (getAllByTitle, title) => {
            const querySelector = getAllByTitle(title);
            return querySelector[0].children[0];
        };
        const tomorrow = moment().add(1, "days").format("MMMM D, YYYY");
        const dateCell = getCellByTitle(getAllByTitle, tomorrow);
        fireEvent.click(dateCell);

        fireEvent.click(getByText('Check and Save'));

        expect(queryByText('Please select patient')).toBeNull();
        expect(queryByText('Please select service')).toBeNull();
        expect(queryByText('Please select date')).toBeNull();
        expect(getAllByText('Please select time').length).toBe(2);
    });

    it('should display all the child components', () => {
        const config = {
            "enableSpecialities": "true"
        };
        const {getByText, getByTestId, getAllByTestId} = renderWithReactIntl(<AppointmentEditor appConfig={config}/>);
        const checkAndSaveButton = getByText('Check and Save');
        fireEvent.click(checkAndSaveButton);
        getByTestId('patient-search');
        getByTestId('service-search');
        getByTestId('service-type-search');
        getByTestId('speciality-search');
        getByTestId('location-search');
        getByTestId('date-selector');
        getByTestId('start-time-selector');
        getByTestId('end-time-selector');
        getByTestId('notes');
        expect(getAllByTestId('error-message').length).toBe(7);
    });

    it('should display recurring plan', () => {
        const {container, getByText} = renderWithReactIntl(<AppointmentEditor/>);
        expect(getByText('Plan')).not.toBeNull();
        expect(container.querySelector('.planLabel')).not.toBeNull();
    });

    it('should render all recurring components on click of recurring appointments checkbox', () => {
        const {container, getByTestId, getByText, getAllByText} = renderWithReactIntl(<AppointmentEditor/>);
        const checkBoxService = container.querySelector('.rc-checkbox-input');
        fireEvent.click(checkBoxService);
        expect(container.querySelector('.checkbox')).toBeChecked;
        getByTestId('start-date-group');
        getByTestId('end-date-group');
        getByTestId('recurrence-type-group');
        expect(getByText('Starts')).not.toBeNull();
        expect(getByText('Today')).not.toBeNull();
        expect(getAllByText('From')).not.toBeNull();
        expect(getAllByText('From').length).toBe(2);
        expect(getByText('To')).not.toBeNull();
        expect(getByText('Ends')).not.toBeNull();
        expect(getByText('After')).not.toBeNull();
        expect(getByText('On')).not.toBeNull();
        expect(getByText('Occurrences')).not.toBeNull();
        expect(getByText('Repeats Every')).not.toBeNull();
        expect(getByText('Day')).not.toBeNull();
        expect(getByText('Week')).not.toBeNull();
        expect(getByText('Choose a time slot')).not.toBeNull();
    });

    it('should display error messages when checkAndSave is clicked and required recurring fields are not selected', () => {
        const {getByText, queryByText, getAllByTestId, getAllByText, container} = renderWithReactIntl(
            <AppointmentEditor/>);
        const saveAppointmentSpy = jest.spyOn(save, 'saveRecurring');
        const checkBox = container.querySelector('.rc-checkbox-input');
        fireEvent.click(checkBox);
        const checkAndSaveButton = getByText('Check and Save');
        fireEvent.click(checkAndSaveButton);
        expect(queryByText('Please select patient')).not.toBeNull();
        expect(queryByText('Please select service')).not.toBeNull();
        expect(queryByText('Please select valid recurrence period')).not.toBeNull();
        expect(getAllByText('Please select time').length).toBe(2);
        expect(getAllByText('Please select date').length).toBe(1);
        expect(getAllByText('Please select recurrence end type').length).toBe(1);
        expect(getAllByTestId('error-message').length).toBe(9);
        expect(saveAppointmentSpy).not.toHaveBeenCalled();

    });

    it('should not display error message for start date & end date when today and after radio buttons are clicked', function () {
        const config = {
            "recurrence": {
                "defaultNumberOfOccurrences": 10
            }
        };
        const {getByText, container, queryAllByText, getByTestId, queryByText} = renderWithReactIntl(<AppointmentEditor
            appConfig={config}/>);
        const saveAppointmentSpy = jest.spyOn(save, 'saveRecurring');
        const checkBox = container.querySelector('.rc-checkbox-input');
        fireEvent.click(checkBox);
        const todayButton = getByTestId("today-radio-button");
        fireEvent.click(todayButton);
        const afterButton = getByTestId("after-radio-button");
        fireEvent.click(afterButton);
        const checkAndSaveButton = getByText('Check and Save');
        fireEvent.click(checkAndSaveButton);
        expect(queryAllByText('Please select date').length).toBe(0);
        expect(saveAppointmentSpy).not.toHaveBeenCalled();
    });

    it('should display all week days on click of recurring checkbox', () => {
        const config = {
            "startOfWeek": "Tuesday",
            "recurrence": {
                "defaultNumberOfOccurrences": 10
            }
        };
        const {container, getByTestId} = renderWithReactIntl(<AppointmentEditor appConfig={config}/>);
        const checkBoxService = container.querySelector('.rc-checkbox-input');
        fireEvent.click(checkBoxService);
        fireEvent.click(getByTestId('week-type'));
        const buttonsOrder = [];
        container.querySelectorAll('.buttonGroup button').forEach(button => buttonsOrder.push(button.innerHTML));
        expect(buttonsOrder).toStrictEqual(['Tu', 'We', 'Th', 'Fr', 'Sa', 'Su', 'Mo']);
    });

    it('should toggle the week day selection on click', () => {
        const config = {
            "startOfWeek": "Tuesday",
            "recurrence": {
                "defaultNumberOfOccurrences": 10
            }
        };
        const {container, getAllByText, getByTestId} = renderWithReactIntl(<AppointmentEditor appConfig={config}/>);
        const checkBoxService = container.querySelector('.rc-checkbox-input');
        fireEvent.click(checkBoxService);
        fireEvent.click(getByTestId('week-type'));
        fireEvent.click(getAllByText('Su')[2]);
        fireEvent.click(getAllByText('We')[2]);
        fireEvent.click(getAllByText('Sa')[2]);
        fireEvent.click(getAllByText('Sa')[2]);
        expect(container.querySelectorAll('.buttonGroup .selected').length).toBe(2);
        expect(container.querySelectorAll('.buttonGroup button:not[.selected]').length).toBe(5);
    });

    it('should display week days error message when check and save is clicked without selecting wek days', () => {
        const config = {
            "startOfWeek": "Tuesday",
            "recurrence": {
                "defaultNumberOfOccurrences": 10
            }
        };
        const {container, getByText, getByTestId} = renderWithReactIntl(<AppointmentEditor appConfig={config}/>);
        const checkBoxService = container.querySelector('.rc-checkbox-input');
        fireEvent.click(checkBoxService);
        fireEvent.click(getByTestId('week-type'));
        getByText('Check and Save');
        getByText('Please select the day(s)');
    });

    //TODO need to add test to check the status of response on click of checkAndSave
    //TODO Not able to do because onChange of time picket is not getting called. Need to fix that
});

