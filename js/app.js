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
import PreviewModuleHandler from './components/PreviewModule.js';
import PreviewModuleForApprovalHandler from './components/PreviewModuleForApproval.js';
import UserInfoHandler from './components/UserInfo.js';
import MyAccountHandler from './components/MyAccount.js';
import '../css/style.css';

let App = React.createClass({ 
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
            user: auth.getUser(),
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
            <div>
                { this.state.loggedIn ? (
                    this.state.admin ? (
                        <ul>
                            <li>
                                {this.state.loggedIn ? (
                                    <Link to="/logout">Log out</Link>
                                ) : (
                                    <Link to="/login">Login</Link>
                                )}
                                {this.state.loggedIn ? (
                                    <div>Admin:&nbsp;{this.state.user}</div> ) : (
                                    <div>You are not logged in</div>
                                )}
                            </li>
                            <li><Link to="/myaccount">My account</Link></li>
                            <li><Link to="/users">Users list</Link></li>
                            <li><Link to="/newuser">New user</Link></li>
                            <li><Link to="/moduleslist">Modules list</Link></li>
                            <li><Link to="/newmodule">New module</Link></li>
                            <RouteHandler />
                        </ul>
                        ) : (
                        <ul>
                            <li>
                            {this.state.loggedIn ? (
                                <Link to="/logout">Log out</Link>
                            ) : (
                                <Link to="/login">Login</Link>
                            )}
                            {this.state.loggedIn ? (
                                <div>Student:&nbsp;{this.state.user}</div> 
                            ) : (
                                <div>You are not logged in</div>
                            )}
                            </li>
                            <li><Link to="/myaccount">My account</Link></li>
                            <li><Link to="/users">Users list</Link></li>
                            <li><Link to="/moduleslist">Modules list</Link></li>
                            <RouteHandler />
                        </ul>
                        )) : (
                        <ul>
                            <li><Link to="/login">Login</Link></li>
                            <li><Link to="/users">Users list</Link></li>
                            <RouteHandler />
                        </ul>
                    )
                }
            </div>
        );
    }
});

let routes = (  
    <Route name="app" path="/" handler={App}>
        <Route name="login" path="/login" handler={LoginHandler}/>
        <Route name="logout" path="/logout" handler={LogoutHandler}/>
        <Route name="users" path="/users" handler={UsersHandler}/>
        <Route name="newuser" path="/newuser" handler={NewUserHandler}/>
        <Route name="moduleslist" path="/moduleslist" handler={ModulesListHandler}/>
        <Route name="editmodule" path="/editmodule" handler={EditModuleHandler}/>
        <Route name="newmodule" path="/newmodule" handler={NewModuleHandler}/>
        <Route name="previewmodule" path="/previewmodule" handler={PreviewModuleHandler}/>
        <Route name="previewmoduleforapproval" path="/previewmoduleforapproval" handler={PreviewModuleForApprovalHandler}/>
        <Route name="userinfo" path="/userinfo" handler={UserInfoHandler}/>
        <Route name="myaccount" path="/myaccount" handler={MyAccountHandler}/>
    </Route>
);

Router.run(routes, function (Handler) {  
    React.render(<Handler/>, document.body);
});