// interfaces
// ReSharper disable InconsistentNaming
interface IE_Event {
    attachEvent(event: string, listener: EventListener): boolean;
    detachEvent(event: string, listener: EventListener): void;
}

interface Window extends IE_Event { }
interface HTMLElement extends IE_Event { }
module DynamicForm.Interfaces {
    "use strict";
    export interface IFormArgs {
        Action: string;
        Items: Array<IFormField>;
        OnSubmit: Function;
        Deletable?: boolean;
        Id?: string;
        Method?: string;
        OnDelete?: Function;
        OnCancel?: Function;
        DomEvents?: Array<IDomEvent>;
    }
    export interface IFormFieldArgs {
        DisplayName: string;
        Name: string;
        Value: any;
        ReadOnly?: boolean;
        Required?: boolean;
        DomEvents?: Array<IDomEvent>;
        Classes?: string;
    }
    export interface ISubscribable {
        subscribe(subscriber: ISubscriber);
        unSubscribe(subscriber: ISubscriber);
    }
    export interface ISubscriber {
        Notify:Function;
    }
    export interface IDomEvent {
        DomEvent: string;
        Action: Function;
    }
    export interface IDisplayable {
        display(callback: (obj: HTMLElement) => void);
    }
    export interface IFormField extends IDisplayable {
        isValid();
    }
    export interface IOption {
        DisplayName: string;
        Value: any;
        Selected?: boolean;
    }
}