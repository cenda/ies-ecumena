import React, { Component } from 'react';
//import logo from './logo.svg';
//import Datepicker from "./components/Datepicker";
import DatePickerComponent from './components/DatePickerComponent'
class App extends Component {
  render() {
    const props = this.props;
    return <DatePickerComponent {...props}/>
  }
}

export default App;
