import React from 'react';
import Calendar from 'rc-calendar';
import 'rc-calendar/assets/index.css';
import DatePicker from 'rc-calendar/lib/Picker';
import PropTypes from "prop-types";
import {
    appointmentDatePicker,
    appointmentDatePickerNotSelected,
    appointmentDatePickerSelected,
    disable
} from '../DatePicker/DatePicker.module.scss';
import classNames from "classnames";


const CalendarPicker = (props) => {

    const {date, isDisabled} = props;

    let styles = [appointmentDatePicker];
    date ? styles.push(appointmentDatePickerSelected)
        : styles.push(appointmentDatePickerNotSelected);
    const calendar = (<Calendar showToday={false} className={classNames(styles)}/>);

    return (
        <div className={classNames(isDisabled ? disable : '')}>
            <DatePicker
                animation="slide-up"
                value={date}
                calendar={calendar}
                onChange={() => undefined}
                dateInputPlaceholder="mm/dd/yyyy"
            >{({value}) => <i className={classNames("fa fa-calendar")}/>}</DatePicker>
        </div>
    );
};

CalendarPicker.propTypes = {
    date: PropTypes.object,
};

export default CalendarPicker;


