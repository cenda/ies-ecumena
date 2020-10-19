import 'react-dates/initialize';
import React, {Component} from 'react';
import moment from 'moment';
import {DatetimePickerTrigger} from 'rc-datetime-picker';
import DayTexts from "./DayTexts";

class Datepicker extends Component {

    state = {
        moment: moment('2013-06-11'),
        loadingData: true,
        yearCycle: null,
        dayCalendar: null,
        dayTexts: [],
        dayNote: null,
        dayName: null,
    };

    getDateFormat = () => {
        const {moment} = this.state;
        return moment.format('YYYY-MM-DD');
    };

    componentDidMount() {
        console.log('componentDidMount');
        moment.updateLocale('cs', {
            months : ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec']
        });

        if (window.location.hash && moment(window.location.hash.replace('#', '')).isValid()) {
            this.setState({
                moment: moment(window.location.hash),
            }, () => {
                this.fetchForData(this.getDateFormat());
            });
        } else {
            this.fetchForData(this.getDateFormat());
        }

        window.addEventListener("hashchange", this.hashChanged, false);
    };

    componentWillMount() {
        window.removeEventListener("hashchange", this.hashChanged, false);
    };


    hashChanged = () => {
        const hashWithoutFirstSign = window.location.hash.replace('#', '');
        console.log({hashWithoutFirstSign});
        if (moment(hashWithoutFirstSign).isValid()) {
            this.handleChange(moment(hashWithoutFirstSign))
        } else {
            window.location.hash = 'invalid';
            this.setState({
                dayTexts: [],
                yearCycle: null,
                loadingData: false,
                dayName: null,
            })
        }
    }

    handleChange = date => {
        if (date) {
            this.setState({
                moment: date,
            }, () => {
                const dateSlug = this.getDateFormat();
                this.fetchForData(dateSlug);
                window.location.hash = dateSlug;
            });
        } else {
            this.fetchForData(this.getDateFormat());
        }
    };

    handleTexts = (dayName, data) => {
        if (Array.isArray(data) && data.length > 0) {
            this.setState({
                dayTexts: data,
                // yearCycle: data[0].acf.year_cycle,
                dayName,
            });
            console.log({handleTexts: data});
        } else {
            this.setState({
                dayTexts: [],
                yearCycle: null,
                dayName: null,
                dayNote: null,
            });
        }
    }
    handleCalendar = data => {
        if (Array.isArray(data) &&
            data.length === 1) {
            this.setState({
                dayCalendar: data[0].content.rendered,
            });
        } else {
            this.setState({
                dayCalendar: null,
            });
        }
    }

    handleNotes = data => {
        if (Array.isArray(data) && data.length === 1) {
            this.setState({
                dayNote: data[0].content.rendered,
            });
        } else {
            this.setState({
                dayNote: null,
            })
        }
    }

    fetchForDayTexts = dayName => {
        const url1 = `http://ies.local/wp-json/wp/v2/lect_days?filter[meta_key]=day_name&filter[meta_compare]=LIKE&filter[meta_value]=${dayName}`;
        const url2 = `http://ies.local/wp-json/wp/v2/lect_days_notes?filter[meta_key]=day_name&filter[meta_compare]=LIKE&filter[meta_value]=${dayName}`;

        console.log({dayName});

        /*const x = fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }},
        ).then(res => res.json()).then(data => {
            this.handleTexts(dayName, data);
        });*/

        const allRequests = [url1, url2].map(url => fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json()));

        Promise.all(allRequests).then(arrayOfResponses => {
            console.log({arrayOfResponses});
            arrayOfResponses.map((data, i) => {
                switch(i) {
                    case 0:
                        this.handleTexts(dayName, data);
                        break;
                    case 1:
                        this.handleNotes(data);
                        break;
                    default:
                        console.log('Neočekávaná data');
                }
            });
            console.log({"The data we got from the server:": arrayOfResponses});
        }).catch(err => console.log({ err }))


    }

    fetchForData = dateSlug => {
        this.setState({loadingData: true});
        // Promise.all: https://www.andreasreiterer.at/single-result-with-promise-all/
        console.log({dateSlug});

        const calendariumSlug = dateSlug.split('-');
        const day = calendariumSlug[2].indexOf('0') === 0 ? calendariumSlug[2].substr(1) : calendariumSlug[2];
        const month = calendariumSlug[1].indexOf('0') === 0 ? calendariumSlug[1].substr(1) : calendariumSlug[1];
        const appliedCalendariumSlug = `${day}-${month}`;

        const urls = [
            `http://ies.local/wp-json/acf/v3/lect_dates/?filter[meta_key]=date&filter[meta_value]=${dateSlug}`,
            `http://ies.local/wp-json/wp/v2/lect_calendarium?slug=${appliedCalendariumSlug}`,
            //`http://odd-raven.w5.wpsandbox.pro/wp-json/acf/v3/date/?filter[meta_key]=lect_date&filter[meta_value]=${dateSlug}`,
            //`http://ies.local/wp-json/wp/v2/lect_calendarium?slug=${dateSlug.substr(5)}`,
        ];
        const allRequests = urls.map(url => fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => response.json()));

        Promise.all(allRequests).then(arrayOfResponses => {
            arrayOfResponses.map((data, i) => {
                switch(i) {
                    case 0:
                        /*console.log({
                            'lect_dates': data,
                            isArray: Array.isArray(data),
                            'data.acf': data[0].acf,
                            'data.acf.day_name_enum': data[0].acf.day_name_enum,
                            'data.acf.day_name_enum.label': data[0].acf.day_name_enum.label
                        });*/
                        if (Array.isArray(data) && data[0].acf && data[0].acf.day_name_enum && data[0].acf.day_name_enum.label) {
                            this.fetchForDayTexts(data[0].acf.day_name_enum.label);
                        } else { console.log('BAD DATA'); }
                        // this.handleTexts(data);
                        break;
                    case 1:
                        console.log({'lect_calendarium': data});
                        this.handleCalendar(data);
                        break;
                    default:
                        console.log('Neočekávaná data');
                }
            });
            console.log({"The data we got from the server:": arrayOfResponses})
        }).catch(err => console.log({ err }))
            .finally(() => {
                this.setState({loadingData: false});
            });

        // fetch(
        //     `http://odd-raven.w5.wpsandbox.pro/wp-json/acf/v3/date/?filter[meta_key]=lect_date&filter[meta_value]=${dateSlug}`,
        //     {
        //         method: 'GET',
        //         headers: {
        //             'Content-Type': 'application/json'
        //         },
        //     })
        //     .then(response => response.json())
        //     .then(response => {
        //         console.log({response});
        //         if (Array.isArray(response) &&
        //             response.length > 0 &&
        //             Array.isArray(response[0].acf.lect_day_name) /*&&
        //             response[0].acf.lect_day_name.some(ldn => Object.keys(ldn).length > 0)*/) {
        //             this.setState({
        //                 dayTexts: response[0].acf.lect_day_name,
        //                 yearCycle: response[0].acf.year_cycle,
        //             });
        //         } else {
        //             this.setState({
        //                 dayTexts: [],
        //                 yearCycle: null,
        //             });
        //         }
        //     })
        //     .catch(err => console.log({ err }))
        //     .finally(() => {
        //         this.setState({loadingData: false});
        //     });
    };



    render() {
        const shortcuts = {
            'Včera': moment().subtract(1, 'days'),
            'Dnes': moment(),
            'Zítra': moment().add(1, 'days'),
        };
        const loadingText = document.querySelector('#root').getAttribute('data-loading-text');
        const { loadingData, dayTexts, dayCalendar, yearCycle, dayName, dayNote } = this.state;
        return (
            <div>
                <DatetimePickerTrigger
                    shortcuts={shortcuts}
                    moment={this.state.moment.locale('cs')}
                    onChange={this.handleChange}
                    showTimePicker={false}
                    weeks={['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So']}
                    months={['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer', 'Čvc', 'Srp', 'Zář', 'Říj', 'Lis', 'Pro']}
                    closeOnSelectDay={true}
                >
                    <input type="text" value={this.state.moment.format('D. M. YYYY')} readOnly/>
                </DatetimePickerTrigger>


                {loadingData && <div className="loading-placeholder"><p>{loadingText}</p></div>}
                {!loadingData && dayTexts && <DayTexts dayTexts={dayTexts} dayCalendar={dayCalendar} dayName={dayName} dayNote={dayNote}></DayTexts>}

            </div>
        );
    };
}

Datepicker.propTypes = {};

export default Datepicker;
