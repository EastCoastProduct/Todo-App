import React from 'react';
import Firebase from 'firebase';
import Router from 'react-router';
import { DefaultRoute, Link, Route, RouteHandler, Navigation } from 'react-router';
import auth from '../auth';
import Dropzone from 'react-dropzone';

//add remove image functionality
//ne radi dobro image upload onChange??

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
            } else { this.setState({ image: '' }) }
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
            } else {
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

    //cancel() {
    //    {auth.isAdmin() ? (this.transitionTo('userinfo', null, {id: this.state.id})) : (this.transitionTo('myaccount'))}
    //},

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
            		if(auth.isAdmin()){ this.transitionTo('users'); } else { this.transitionTo('changesuccess', null, { successMessage: 'Your user info is successfuly changed!' }); }
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
		return <div id='changeData-form'> 
                <fieldset>
                <div>
                    <Dropzone ref="dropzone" onDrop={this.onDrop} >
                        {this.state.image == '' ? (
                            <div className='paddingAll'>Drop file here, or click to select file to upload.</div>
                        ) : (<div><img className="usersImageEdit" src={ this.state.image }/></div>)}
                    </Dropzone>
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
	}
});
export default EditUser;