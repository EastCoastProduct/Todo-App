import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';
import Dropzone from 'react-dropzone';

let EditUser = React.createClass({
	mixins: [Router.Navigation],
    
	getInitialState() {
        var currentRoutes = this.context.router.getCurrentRoutes();
        var lastRoute = currentRoutes[currentRoutes.length - 1];
        if(lastRoute.name != "login"){
            var element = document.body;
            element.className="";
        }

		return { id: this.props.query.id, message: '', description: '', oldEmail: '', newEmail: '', password: '', changeEmailMessage: '', changePasswordMessage: '', 
                email: '', oldPassword: '', newPassword: '', infoSuccessMessage: '', emailSuccessMessage: '', passwordSuccessMessage: '' };
	},

    componentWillReceiveProps: function(nextProps, nextState) {
        if (nextProps !== this.props){
            this.getUserData(nextProps.query.id);
        }
    },

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/');
        this.getUserData(this.state.id);
    },

    componentWillUnmount() {
    	this.firebaseDb.off();
        this.userFb.off();
    },

    getUserData(id) {
        var thisUserDb = new Firebase(this.userFb + '/' + id);
        thisUserDb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({ id: id, firstName: data.first_name, lastName: data.last_name, isAdmin: data.isAdmin });
            if(data.description){
            	this.setState({ description: data.description })
            } 
            if(data.image){
                this.setState({ image: data.image })
            } else {
                this.setState({ image: '' })
            }
        }.bind(this));
        thisUserDb.on('child_added', function(snap) {
            var data = snap.val();
            var key = snap.key();
            if (data != null && key == "image") {
                this.setState({ image: data })
            }
        }.bind(this));
        thisUserDb.on('child_changed', function(snap) {
            var data = snap.val();
            var key = snap.key();
            if (data != null && key == "image") {
                this.setState({ image: data })
            } else { this.setState({ image: '' }) }
        }.bind(this));
        thisUserDb.on('child_removed', function(snap) {
            var data = snap.val();
            var key = snap.key();
            if (key == "image") {
                this.setState({ image: '' })
            }
        }.bind(this));
    },

    inputFirstNameTextChange(e) {
    	this.setState({firstName: e.target.value, firstNameMessage: '', message: ''});
	},

	inputLastNameTextChange(e) {
    	this.setState({lastName: e.target.value, lastNameMessage: '', message: ''});
	},

	inputDescriptionTextChange(e) {
    	this.setState({description: e.target.value, descriptionMessage: '', message: ''});
	},

    inputOldEmailTextChange(e){
        this.setState({oldEmail: e.target.value, oldEmailMessage: '', changeEmailMessage: '' });
    },

    inputNewEmailTextChange(e){
        this.setState({newEmail: e.target.value, newEmailMessage: '', changeEmailMessage: '' });
    },

    inputPasswordTextChange(e){
        this.setState({password: e.target.value, passwordMessage: '', changeEmailMessage: '' });
    },

    inputEmailTextChange(e){
        this.setState({email: e.target.value, emailMessage: '', changePasswordMessage: '' });
    },

    inputOldPasswordTextChange(e){
        this.setState({oldPassword: e.target.value, oldPasswordMessage: '', changePasswordMessage: '' });
    },

    inputNewPasswordTextChange(e){
        this.setState({newPassword: e.target.value, newPasswordMessage: '', changePasswordMessage: '' });
    },

    editUser(e) {
    	e.preventDefault();
        this.handleValidationEditUser(res => {
            if(res){
                var thisUserDb = new Firebase(this.userFb + '/' + this.state.id);
    			thisUserDb.update({ first_name: this.state.firstName, last_name: this.state.lastName, description: this.state.description })
                this.setState({ infoSuccessMessage: 'User info is successfuly changed!' });
            }
        })
    },

    handleValidationEditUser(response){
        response = arguments[arguments.length - 1];
        var err = false;
        if(this.state.firstName.trim().length == 0){
            this.setState({ firstNameMessage: 'Enter first name.' });
            err = true;
        }
        if(this.state.lastName.trim().length == 0){
            this.setState({ lastNameMessage: 'Enter last name.' });
            err = true;
        }
        if(this.state.description.trim().length == 0){
            this.setState({ descriptionMessage: 'Enter description.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

    changeEmail(e){
        e.preventDefault();
        this.handleValidationChangeEmail(res => {
            if(res){
                var thisUserDb = new Firebase(this.userFb + '/' + this.state.id);
                thisUserDb.once("value", function(snap){
                    var userData = snap.val();
                    if(userData.email != this.state.oldEmail){
                        this.setState({changeEmailMessage: "The specified email address is incorrect."});
                    } else {
                        this.firebaseDb.changeEmail({
                            oldEmail: this.state.oldEmail, newEmail: this.state.newEmail, password: this.state.password
                        }, function(error){
                            if(error) {
                                switch (error.code) {
                                    case "INVALID_PASSWORD":
                                        this.setState({error: true, changeEmailMessage: "The specified user account password is incorrect."});
                                    break;
                                    case "INVALID_USER":
                                        this.setState({error: true, changeEmailMessage: "The specified user account does not exist."});
                                    break;
                                    default:
                                    this.setState({error: true, changeEmailMessage: "Error creating user"});
                                }
                            } else {
                                thisUserDb.update({ email: this.state.newEmail })
                                this.setState({ emailSuccessMessage: 'Your email address is successfuly changed!' });
                            }
                        }.bind(this))
                    }
                }.bind(this))
            }
        })
    },

    handleValidationChangeEmail(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;
        if(!emailRegex.test(this.state.oldEmail)){
            this.setState({ oldEmailMessage: 'Enter a valid email address.' }); 
            err = true;
        }
        if(!emailRegex.test(this.state.newEmail)){
            this.setState({ newEmailMessage: 'Enter a valid email address.' }); 
            err = true;
        }
        if(this.state.password.trim().length == 0){
            this.setState({ passwordMessage: 'Enter password.' });
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

    changePassword(e){
        e.preventDefault();
        this.handleValidationChangePassword(res => {
            if(res){
                var thisUserDb = new Firebase(this.userFb + '/' + this.state.id);
                thisUserDb.once("value", function(snap){
                    var userData = snap.val();
                    if(userData.email != this.state.email){
                        this.setState({changePasswordMessage: "The specified email address is incorrect."});
                    } else {
                        this.firebaseDb.changePassword({
                            email: this.state.email, oldPassword: this.state.oldPassword, newPassword: this.state.newPassword
                        }, function(error){
                            if(error) {
                                switch (error.code) {
                                    case "INVALID_PASSWORD":
                                        this.setState({changePasswordMessage: "The specified user account password is incorrect."});
                                    break;
                                    case "INVALID_USER":
                                        this.setState({changePasswordMessage: "The specified user account does not exist."});
                                    break;
                                    default:
                                    this.setState({changePasswordMessage: "Error changing password."});
                                }
                            } else {
                                thisUserDb.once("value", function(snap){
                                    var userData = snap.val();
                                    if(userData.status == "created"){
                                        thisUserDb.update({ status: "active" })
                                        localStorage.userStatus = "active";
                                        this.setState({ passwordSuccessMessage: 'Your password is successfully changed!' });
                                    } else {
                                        this.setState({ passwordSuccessMessage: 'Your password is successfully changed!' });
                                    }
                                }.bind(this))
                            }
                        }.bind(this))
                    }
                }.bind(this))
            }
        })
    },

    handleValidationChangePassword(response){
        response = arguments[arguments.length - 1];
        var err = false;
        var emailRegex = /^[a-z][a-zA-Z0-9_]*(\.[a-zA-Z][a-zA-Z0-9_]*)?@[a-z][a-zA-Z-0-9]*\.[a-z]+(\.[a-z]+)?$/;
        var passwordRegex = /^(?=.*\d)[0-9a-zA-Z]{6,}$/;
        if(!emailRegex.test(this.state.email)){
            this.setState({ emailMessage: 'Enter a valid email address.' }); 
            err = true;
        }
        if(this.state.oldPassword.trim().length == 0){
            this.setState({ oldPasswordMessage: 'Enter current password.' });
            err = true;
        }
        if(!passwordRegex.test(this.state.newPassword)){
            this.setState({ newPasswordMessage: 'Your password must contain at least 6 characters and at least one number.' }); 
            err = true;
        }
        if(err){ response (false); return; } else { response (true); return; }
    },

    onDrop(files) {
        var f = files[0];
        var reader = new FileReader();
        reader.onload = (function(theFile) {
            return function(e) {
                var id = this.state.id;
                var filePayload = e.target.result;
                var fb = new Firebase('https://app-todo-list.firebaseio.com/users/' + id);
                fb.update({ image: filePayload });
            }.bind(this);
        }.bind(this))(f);
        reader.readAsDataURL(f);
    },

    removeImage(e){
        var thisUserDb = new Firebase(this.userFb + '/' + this.state.id);
        var imgFb = new Firebase(thisUserDb + '/image');
        imgFb.remove();
        this.setState({image: ''});
    },

	render() {
		return <div>
                {this.state.infoSuccessMessage == '' ? (
                    <div>
                        <h2>Change basic info</h2>
                        <div id='changeData-form'> 
                            <fieldset>
                                <div>
                                    <Dropzone ref="dropzone" onDrop={this.onDrop} >
                                        {this.state.image == '' ? (
                                            <div className='paddingAll'>Drop file here, or click to select file to upload.</div>
                                        ) : (<div><img className="usersImageEdit" src={ this.state.image }/></div>)}
                                    </Dropzone>
                                    <div onClick={this.removeImage}>Remove</div>
                                </div>
                                <form className='paddingTop' onSubmit={this.editUser} >
                                    <input type='text' placeholder='First name' value={this.state.firstName} onChange = {this.inputFirstNameTextChange} />
                                    <div className='errorMessage'>{this.state.firstNameMessage}</div>
                                    <input type='text' placeholder='Last name' value={this.state.lastName} onChange = {this.inputLastNameTextChange} />
                                    <div className='errorMessage'>{this.state.lastNameMessage}</div>
                                    <textarea rows={8} placeholder='Description' value = {this.state.description} onChange = {this.inputDescriptionTextChange} />
                                    <div className='errorMessage'>{this.state.descriptionMessage}</div>
                                    <input type='submit' value='Save'/>
                                </form>
                            </fieldset>
                        </div>
                    </div>
                    ) : (
                    <div>
                        <h2>Basic info</h2>
                        <p className='approved'>{this.state.infoSuccessMessage}</p>
                    </div>)}

                {!auth.isAdmin() || (auth.getUserId() === this.state.id) ? (
                    <div>
                        {this.state.emailSuccessMessage == '' ? (
                            <div>
                                <h2>Change email</h2>
                                <div id='changeData-form'>
                                    <fieldset>
                                        <form onSubmit={this.changeEmail} >
                                                <input type='email' placeholder="Old Email" value={this.state.oldEmail} onChange = {this.inputOldEmailTextChange} />
                                                <div className='errorMessage'>{this.state.oldEmailMessage}</div>

                                                <input type='email' placeholder="New Email" value={this.state.newEmail} onChange = {this.inputNewEmailTextChange} />
                                                <div className='errorMessage'>{this.state.newEmailMessage}</div>

                                                <input type='password' placeholder="Password" value={this.state.password} onChange = {this.inputPasswordTextChange} />
                                                <div className='errorMessage'>{this.state.passwordMessage}</div>
                                                <input type='submit' value='Save'/>
                                        </form>
                                    </fieldset>
                                    <div className='errorMessage paddingLeft'>{this.state.changeEmailMessage}</div>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2>Email address</h2>
                                <p className='approved'>{this.state.emailSuccessMessage}</p>
                            </div>)}
                        
                        {this.state.passwordSuccessMessage == '' ? (
                            <div>
                                <h2>Change password</h2>
                                <div id='changeData-form'>
                                <fieldset>
                                    <form onSubmit={this.changePassword} >
                                        <input type='email' placeholder='Email' value={this.state.email} onChange = {this.inputEmailTextChange} />
                                        <div className='errorMessage'>{this.state.emailMessage}</div>

                                        <input type='password' placeholder='Old password' value={this.state.oldPassword} onChange = {this.inputOldPasswordTextChange} />
                                        <div className='errorMessage'>{this.state.oldPasswordMessage}</div>

                                        <input type='password' placeholder='New password' value={this.state.newPassword} onChange = {this.inputNewPasswordTextChange} />
                                        <div className='errorMessage'>{this.state.newPasswordMessage}</div>
                                        <input type='submit' value='Save'/>
                                    </form>
                                </fieldset>
                                <div className='errorMessage paddingLeft'>{this.state.changePasswordMessage}</div>
                            </div>
                            </div>
                        ) : (
                            <div>
                                <h2>Password</h2>
                                <p className='approved'>{this.state.passwordSuccessMessage}</p>
                            </div>)}
                        </div>
                ) : (<div></div>)}    
            </div>
	}
});
export default EditUser;