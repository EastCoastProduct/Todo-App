import React from 'react';  
import auth from '../auth';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';

let Logout = React.createClass({
    mixins: [Router.Navigation],

    componentDidMount() {
        auth.logout();
        this.transitionTo('login');
    },

    render() {
        return <div></div>;
    }
});

export default Logout; 