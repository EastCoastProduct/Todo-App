import React from 'react';  
import Router from 'react-router';  
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from './auth';
import Firebase from 'firebase';
import LoginHandler from './components/Login.js';
import LogoutHandler from './components/Logout.js';
import NewUserHandler from './components/NewUser.js';
import UsersHandler from './components/Users.js';
import ModulesListHandler from './components/ModulesList.js';
import NewModuleHandler from './components/NewModule.js';
import EditModuleHandler from './components/EditModule.js';
import UserInfoHandler from './components/UserInfo.js';
import MyAccountHandler from './components/MyAccount.js';
import EditUserHandler from './components/EditUser.js';
import ChangeEmailHandler from './components/ChangeEmail.js';
import ChangePasswordHandler from './components/ChangePassword.js';
import ForgotPasswordHandler from './components/ForgotPassword.js';
import TaxonomyHandler from './components/Taxonomy.js';
import HomeHandler from './components/Home.js'
import ChangeSuccessHandler from './components/ChangeSuccess.js';
import '../css/style.css';

let App = React.createClass({ 
    contextTypes: {
        router: React.PropTypes.func.isRequired
    },

    getInitialState() {
        return {
            loggedIn: auth.loggedIn(),
            user: auth.getUser(),
            admin: auth.isAdmin()
        };
    },

    setStateOnAuth(loggedIn) {
        this.setState({
            loggedIn: loggedIn,
            user: auth.getUser(), //users first name and last name
            admin: auth.isAdmin()
        });
    },

    componentWillMount() {
        auth.onChange = this.setStateOnAuth;
    },

    componentDidMount() {
        auth.onChange = this.setStateOnAuth;
    },

    render() {
        return (
            <div id='main'className='clear'>
                { this.state.loggedIn ? (
                    this.state.admin ? (
                        <div>
                            <div className='right'>
                                <span className='marginForNavigation'><Link to="/users" className='rightLink'>Users</Link></span>
                                <span className='marginForNavigation'><Link to="/newuser" className='rightLink'>New user</Link></span>
                                <span className='marginForNavigation'><Link to="/moduleslist" className='rightLink'>Modules</Link></span>
                                <span className='marginForNavigation'><Link to="/newmodule" className='rightLink'>New module</Link></span>
                                <span className='marginForNavigation'><Link to="/taxonomy" className='rightLink'>Taxonomy</Link></span>
                                <span className='marginForNavigation'><Link to="/logout" className='rightLink'>Log out</Link></span>
                            </div>
                            <div id="sidebar"><MyAccountHandler/></div>
                            <div id="page-wrap"><RouteHandler /></div>
                        </div>
                        ) : (
                        <div>
                            <div className='right'>
                                <span className='marginForNavigation'><Link to="/users" className='rightLink'>Users </Link></span>
                                <span className='marginForNavigation'><Link to="/moduleslist" className='rightLink'>Modules </Link></span>
                                <span><Link to="/logout" className='rightLink'>Logout </Link></span>
                            </div>
                            <div id="sidebar"><MyAccountHandler/></div>
                            <div id="page-wrap"><RouteHandler /></div>
                        </div>
                        )) : (
                        <div className=''>
                            <div className='right'>
                                <span className='marginForNavigation'><Link to="/users" className='rightLink'>Users </Link></span>
                                <span className='marginForNavigation'><Link to="/login" className='rightLink'>Login </Link></span>
                            </div>
                            <div id="sidebarEmpty"></div>
                            <div id="page-wrap"><RouteHandler /></div>
                        </div>
                    )
                }
            </div>
        );
    }
});

let routes = (  
    <Route name="app" path="/" handler={App}>
        <DefaultRoute name="home" handler={HomeHandler}/>
        <Route name="login" path="/login" handler={LoginHandler}/>
        <Route name="logout" path="/logout" handler={LogoutHandler}/>
        <Route name="users" path="/users" handler={UsersHandler}/>
        <Route name="newuser" path="/newuser" handler={NewUserHandler}/>
        <Route name="moduleslist" path="/moduleslist" handler={ModulesListHandler}/>
        <Route name="editmodule" path="/editmodule" handler={EditModuleHandler}/>
        <Route name="newmodule" path="/newmodule" handler={NewModuleHandler}/>
        <Route name="userinfo" path="/userinfo/:id" handler={UserInfoHandler}/>
        <Route name="myaccount" path="/myaccount" handler={MyAccountHandler}/>
        <Route name="edituser" path="/edituser" handler={EditUserHandler}/>
        <Route name="changeemail" path="/changeemail" handler={ChangeEmailHandler}/>
        <Route name="changepassword" path="/changepassword" handler={ChangePasswordHandler}/>
        <Route name="forgotpassword" path="/forgotpassword" handler={ForgotPasswordHandler}/>
        <Route name="taxonomy" path="/taxonomy" handler={TaxonomyHandler}/>
        <Route name="changesuccess" path="/changesuccess" handler={ChangeSuccessHandler}/>
    </Route>
);

Router.run(routes, function (Handler) {  
    React.render(<Handler/>, document.body);
});