import 'react-dates/initialize';
import React, {Component} from 'react';
import moment from 'moment';
import DayTexts from './DayTexts';
import DatePicker from 'react-date-picker';
import CustomCalendarIcon from './CustomCalendarIcon.js';
// import CalendarIcon from 'react-dates/esm/components/CalendarIcon';

const defaultState = {
    currentDate: new Date(),
    loadingData: false,
    dayCalendarium: null,
    dayTexts: [],
    dayNote: null,
    dayName: null,
};


class DatepickerComponent extends Component {


    state = {
        ...defaultState
    };

    getDateFormat = () => {
        const {currentDate} = this.state;
        return moment(currentDate).format('YYYY-MM-DD');
    };

    componentDidMount() {
        if (window.location.hash && moment(window.location.hash.replace('#', '')).isValid()) {
            this.setState({
                currentDate: new Date(window.location.hash.replace('#', '')),
            }, () => {
                this.fetchForData(this.getDateFormat());
            });
        } else {
            this.fetchForData(this.getDateFormat());
        }

        window.addEventListener('hashchange', this.hashChanged, false);
    };

    componentWillMount() {
        window.removeEventListener('hashchange', this.hashChanged, false);
    };

    invalidate = (stopLoadingData = true) => {
        const hashWithoutFirstSign = window.location.hash.replace('#', '');
        this.setState({
            ...defaultState,
            currentDate: moment(hashWithoutFirstSign).isValid() ? new Date(hashWithoutFirstSign) : new Date(),
            loadingData: !stopLoadingData,
        });
    }

    hashChanged = () => {
        const hashWithoutFirstSign = window.location.hash.replace('#', '');
        if (moment(hashWithoutFirstSign).isValid()) {
            this.handleChange(new Date(hashWithoutFirstSign))
        } else {
            window.location.hash = 'invalid';
            this.invalidate();
        }
    }

    handleChange = date => {
        const { currentDate } = this.state;
        if (JSON.stringify(date) !== JSON.stringify(currentDate)) {
            this.setState({
                currentDate: date,
            }, () => {
                const dateSlug = this.getDateFormat();
                this.fetchForData(dateSlug);
                window.location.hash = dateSlug;
            });
        } else {
            console.log('handleChange received no date, this function loves data, give it some!');
        }
    };

    handleResponse = (resourceType, data, dayName = null) => {
        if (Array.isArray(data) && data.length > 0) {
            switch (resourceType) {
                case 'notes':
                    this.setState({
                        dayNote: data[0].content.rendered,
                    })
                    break;
                case 'calendarium':
                    this.setState({
                        dayCalendarium: data[0].content.rendered,
                    })
                    break;
                case 'texts':
                    this.setState({
                        dayTexts: data,
                        dayName,
                    });
                    break;
                default:
                    console.log('Neočekávaná data');
                    this.invalidate();
            }
        } else {
            switch (resourceType) {
                case 'notes':
                    this.setState({
                        dayNote: null,
                    })
                    break;
                case 'calendarium':
                    this.setState({
                        dayCalendarium: null,
                    })
                    break;
                case 'texts':
                    this.invalidate(false);
                    break;
                default:
                    console.log('Neočekávaná data');
                    this.invalidate();
            }
        }
    }

    fetchForData = async dateSlug => {
        this.setState({loadingData: true});
        // Promise.all: https://www.andreasreiterer.at/single-result-with-promise-all/

        let dayName = null;
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };


        await fetch(
            `${process.env.NODE_ENV !== 'production' ? 'http://ies.local' : process.env.REACT_APP_WEB_URL}/wp-json/acf/v3/lect_dates/?filter[meta_key]=date&filter[meta_value]=${dateSlug}`,
            {
            ...requestOptions,
        })
            .then(response => response.json())
            .then(data => {
                window.dataX = data;
                if (Array.isArray(data) && data.length && data[0].acf && data[0].acf.day_name_enum && data[0].acf.day_name_enum.label) {
                    dayName = data[0].acf.day_name_enum.label;
                }
            }).catch(err => console.log({errFetchDate: err}));

        const calendariumSlug = dateSlug.split('-');
        const day = calendariumSlug[2].indexOf('0') === 0 ? calendariumSlug[2].substr(1) : calendariumSlug[2];
        const month = calendariumSlug[1].indexOf('0') === 0 ? calendariumSlug[1].substr(1) : calendariumSlug[1];
        const appliedCalendariumSlug = `${day}-${month}`;

        const urls = [
            // FETCH FOR CALENDARIUM:
            `${process.env.NODE_ENV !== 'production' ? 'http://ies.local' : process.env.REACT_APP_WEB_URL}/wp-json/wp/v2/lect_calendarium?slug=${appliedCalendariumSlug}`,
            // FETCH FOR DAY TEXTS
            `${process.env.NODE_ENV !== 'production' ? 'http://ies.local' : process.env.REACT_APP_WEB_URL}/wp-json/wp/v2/lect_days?filter[meta_key]=day_name&filter[meta_compare]=LIKE&per_page=100&filter[meta_value]=${encodeURIComponent(dayName)}`,
            // FETCH FOR DAY NOTES
            `${process.env.NODE_ENV !== 'production' ? 'http://ies.local' : process.env.REACT_APP_WEB_URL}/wp-json/wp/v2/lect_days_notes?filter[meta_key]=day_name&filter[meta_compare]=LIKE&per_page=100&filter[meta_value]=${encodeURIComponent(dayName)}`,
        ];
        const allRequests = urls.map(url => fetch(url, {
            ...requestOptions
        }).then(response => response.json()));

        Promise.all(allRequests)
            .then(arrayOfResponses => {
                arrayOfResponses.map((data, i) => {
                    switch (i) {
                        case 0:
                            this.handleResponse('calendarium', data);
                            break;
                        case 1:
                            this.handleResponse('texts', data, dayName);
                            break;
                        case 2:
                            this.handleResponse('notes', data);
                            break;
                        default:
                            console.log('Neočekávaná data');
                            this.invalidate();
                    }
                });
            })
            .catch(err => console.log({err}))
            .finally(() => {
                this.setState({loadingData: false});
            });

    };

    render() {
        const {msgLoadingData, msgNoTexts, msgInvalidFormat} = this.props;
        const {loadingData, dayTexts, dayCalendarium, dayName, dayNote, currentDate} = this.state;
        return (
            <div>
                <div className="select-date">
                    <strong>Vyberte datum</strong>
                    <DatePicker
                        onChange={this.handleChange}
                        value={currentDate}
                        clearIcon={null}
                        /*format="d. MMMM. yyyy"*/
                        locale="cs-CZ"
                        disabled={loadingData}
                        //calendarIcon={<CalendarIcon />}
                        calendarIcon={<CustomCalendarIcon />}
                    />
                </div>

                {loadingData && <div className="loading-placeholder">
                    <div className="loader"></div>
                    <h3>{msgLoadingData}</h3>
                </div>}
                {!loadingData && dayTexts &&
                    <DayTexts
                        dayTexts={dayTexts}
                        dayCalendar={dayCalendarium}
                        dayName={dayName}
                        dayNote={dayNote}
                        msgNoTexts={msgNoTexts}
                        msgInvalidFormat={msgInvalidFormat}
                    />
                }

            </div>
        );
    };
}

DatepickerComponent.propTypes = {};

export default DatepickerComponent;
