import React, {Component} from 'react';

class DayTexts extends Component {
    getTexts = () => {
        const { dayTexts } = this.props;

        const sortedDayTexts = dayTexts.sort((a,b) => (a.acf.block_order > b.acf.block_order) ? 1 : ((b.acf.block_order > a.acf.block_order) ? -1 : 0));

        return sortedDayTexts.map(day => {
            return (<div key={day.acf.reference} className="lectio-text">
                <h3 className="color--text" dangerouslySetInnerHTML={{__html: day.acf.reference}}></h3>
                <div dangerouslySetInnerHTML={{__html: day.content.rendered}} />
            </div>)
        });
    }

    render() {
        const { dayTexts, dayName, dayCalendar, dayNote, msgInvalidFormat, msgNoTexts } = this.props;

        if (dayTexts.length === 0) {
            return (<h2 className="error--no-text">{msgNoTexts}</h2>);
        }

        return (
            <div>
                {window.location.hash === '#invalid' && <strong className="error--format-invalid">{msgInvalidFormat}</strong>}
                <h2 dangerouslySetInnerHTML={{__html: dayName}}></h2>

                {dayCalendar && <div className="lectio-text">
                    <h3>Kalendárium:</h3>
                    <div dangerouslySetInnerHTML={{__html: dayCalendar}}></div>
                </div>}

                {dayNote && <div className="lectio-text">
                    <h3>Popis lekcionáře:</h3>
                    <div dangerouslySetInnerHTML={{__html: dayNote}}></div>
                </div>}

                <hr />

                {this.getTexts()}
            </div>
        );
    }
}

export default DayTexts;
