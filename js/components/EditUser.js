import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';
import Dropzone from 'react-dropzone';

let EditUser = React.createClass({
	mixins: [Router.Navigation],
    
	getInitialState() {
		return { id: this.props.query.id, message: '', description: '' };
	},

	componentWillMount() {
		this.firebaseDb = new Firebase('https://app-todo-list.firebaseio.com/');
        this.userFb = new Firebase('https://app-todo-list.firebaseio.com/users/' + this.state.id);
        this.getUserData();
        this.userFb.on('child_changed', function(snap) {
            var data = snap.val();
            if (data != null) {
                this.setState({ image: data })
            } else { this.image = ''; }
        }.bind(this));
    },

    componentWillUnmount() {
    	this.firebaseDb.off();
        this.userFb.off();
    },

    getUserData() {
        this.userFb.once("value", function(snapshot){
            var data = snapshot.val();
            this.setState({
                firstName: data.first_name,
                lastName: data.last_name,
                isAdmin: data.isAdmin
            });
            if(data.description){
            	this.setState({ description: data.description })
            } 
            if(data.image){
                this.setState({ image: data.image })
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

    cancel() {
        {auth.isAdmin() ? (this.transitionTo('userinfo', null, {id: this.state.id})) : (this.transitionTo('myaccount'))}
    },

    editUser(e) {
    	e.preventDefault();
        this.handleValidation(res => {
            if(res){
            	this.userFb.once("value", function(snapshot){
            		var userData = snapshot.val();
            		if(userData.first_name != this.state.firstName){
            			this.userFb.update({ first_name: this.state.firstName })
            		}
            		if(userData.last_name != this.state.lastName){
            			this.userFb.update({ last_name: this.state.lastName })
            		}
            		if(userData.description){
            			if(userData.description != this.state.description){
            				this.userFb.update({ description: this.state.description })
            			}
            		} else { this.userFb.update({ description: this.state.description })}
            		if(auth.isAdmin()){ this.transitionTo('users'); } else { this.transitionTo('myaccount'); }
            	}.bind(this))
            }
        })
    },

    handleValidation(response){
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

    onDrop(files) { //fix users id
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

	render() {
		return <div> 

                <div>
                    <span>Profile image:</span>
                    <Dropzone ref="dropzone" onDrop={this.onDrop} >
                        {this.image == '' ? (
                            <div>Drop file here, or click to select file to upload.</div>
                        ) : (
                            <div><img className="usersImage" src={ this.state.image }/></div>
                        )}
                    </Dropzone>
                </div>

				<form onSubmit={this.editUser} >
					<div><span>First name:</span>
						<input type = 'text' value = { this.state.firstName } onChange = {this.inputFirstNameTextChange} />
                        <div>{this.state.firstNameMessage}</div>
					</div>
					<div><span>Last name:</span>
						<input type = 'text' value = { this.state.lastName } onChange = {this.inputLastNameTextChange} />
                        <div>{this.state.lastNameMessage}</div>
					</div>
					<div><span>Description:</span>
						<input type = 'text' value = { this.state.description } onChange = {this.inputDescriptionTextChange} />
                        <div>{this.state.descriptionMessage}</div>
					</div>
					<div><span><button>Save</button></span></div>
                    <div><span><button onClick = {this.cancel}>Cancel</button></span></div>
				</form>
			</div>
	}
});
export default EditUser;