export { DIDMailto };
/**
 * Client for interacting with the `access/*` capabilities.
 */
export class AccessClient extends Base {
    /**
     * Authorize the current agent to use capabilities granted to the passed
     * email account.
     *
     * @deprecated Use `request` instead.
     *
     * @param {`${string}@${string}`} email
     * @param {object} [options]
     * @param {AbortSignal} [options.signal]
     * @param {Iterable<{ can: API.Ability }>} [options.capabilities]
     */
    authorize(email: `${string}@${string}`, options?: {
        signal?: AbortSignal | undefined;
        capabilities?: Iterable<{
            can: API.Ability;
        }> | undefined;
    } | undefined): Promise<Agent.Transport.Tuple<API.Delegation<Agent.Capabilities>>>;
    /**
     * Claim delegations granted to the account associated with this agent.
     *
     * @param {object} [input]
     * @param {API.DID} [input.audience]
     */
    claim(input?: {
        audience?: `did:${string}:${string}` | undefined;
    } | undefined): Promise<Agent.Transport.Tuple<API.Delegation<Agent.Capabilities>>>;
    /**
     * Requests specified `access` level from the account from the given account.
     *
     * @param {object} input
     * @param {API.AccountDID} input.account
     * @param {API.Access} [input.access]
     * @param {AbortSignal} [input.signal]
     */
    request(input: {
        account: API.AccountDID;
        access?: API.Access | undefined;
        signal?: AbortSignal | undefined;
    }): Promise<Agent.Result<{
        model: {
            agent: Agent.Agent<import("@web3-storage/access/types").Service>;
            audience: `did:${string}:${string}`;
            provider: `did:web:${string}`;
            expiration: number;
            request: Agent.Link<unknown, number, number, 1>;
        };
        readonly agent: Agent.Agent<import("@web3-storage/access/types").Service>;
        readonly audience: `did:${string}:${string}`;
        readonly expiration: Date;
        readonly request: Agent.Link<any, number, number, 1>;
        readonly provider: `did:web:${string}`;
        poll(): Promise<Agent.Result<API.Delegation<Agent.Capabilities>[], Agent.InvocationError | Agent.AccessClaimFailure | {
            model: {
                agent: Agent.Agent<import("@web3-storage/access/types").Service>;
                audience: `did:${string}:${string}`;
                provider: `did:web:${string}`;
                expiration: number;
                request: Agent.Link<any, number, number, 1>;
            };
            readonly name: string;
            readonly request: Agent.Link<any, number, number, 1>;
            readonly expiredAt: Date;
            describe(): string;
            readonly message: string;
            toJSON(): {
                name: string;
                message: string;
                stack: string | undefined;
            };
            stack?: string | undefined;
            cause?: unknown;
        }>>;
        claim({ signal, interval }?: {
            interval?: number | undefined;
            signal?: AbortSignal | undefined;
        } | undefined): Promise<Agent.Result<Agent.Access.GrantedAccess, Error>>;
    }, Agent.InvocationError | Agent.AccessAuthorizeFailure>>;
    /**
     * Shares access with delegates.
     *
     * @param {object} input
     * @param {API.Delegation[]} input.delegations
     * @param {API.SpaceDID} [input.space]
     * @param {API.Delegation[]} [input.proofs]
     */
    delegate(input: {
        delegations: API.Delegation[];
        space?: `did:key:${string}` | undefined;
        proofs?: API.Delegation<Agent.Capabilities>[] | undefined;
    }): Promise<{
        error: Agent.Failure;
        ok?: undefined;
    } | Agent.Result<Agent.Unit, Agent.HandlerNotFound | Agent.HandlerExecutionError | Agent.InvalidAudience | Agent.Unauthorized | Agent.AccessDelegateFailure>>;
}
export function claim({ agent }: {
    agent: API.Agent;
}, input?: {
    audience?: `did:${string}:${string}` | undefined;
} | undefined): Promise<Agent.Result<Agent.Access.GrantedAccess, Agent.InvocationError | Agent.AccessClaimFailure>>;
export function request({ agent }: {
    agent: API.Agent;
}, input: {
    account: API.AccountDID;
    access?: API.Access | undefined;
    audience?: `did:${string}:${string}` | undefined;
}): Promise<Agent.Result<{
    model: {
        agent: Agent.Agent<import("@web3-storage/access/types").Service>;
        audience: `did:${string}:${string}`;
        provider: `did:web:${string}`;
        expiration: number;
        request: Agent.Link<unknown, number, number, 1>;
    };
    readonly agent: Agent.Agent<import("@web3-storage/access/types").Service>;
    readonly audience: `did:${string}:${string}`;
    readonly expiration: Date;
    readonly request: Agent.Link<any, number, number, 1>;
    readonly provider: `did:web:${string}`;
    poll(): Promise<Agent.Result<API.Delegation<Agent.Capabilities>[], Agent.InvocationError | Agent.AccessClaimFailure | {
        model: {
            agent: Agent.Agent<import("@web3-storage/access/types").Service>;
            audience: `did:${string}:${string}`;
            provider: `did:web:${string}`;
            expiration: number;
            request: Agent.Link<any, number, number, 1>;
        };
        readonly name: string;
        readonly request: Agent.Link<any, number, number, 1>;
        readonly expiredAt: Date;
        describe(): string;
        readonly message: string;
        toJSON(): {
            name: string;
            message: string;
            stack: string | undefined;
        };
        stack?: string | undefined;
        cause?: unknown;
    }>>;
    claim({ signal, interval }?: {
        interval?: number | undefined;
        signal?: AbortSignal | undefined;
    } | undefined): Promise<Agent.Result<Agent.Access.GrantedAccess, Error>>;
}, Agent.InvocationError | Agent.AccessAuthorizeFailure>>;
export function createPendingAccessRequest({ agent }: {
    agent: API.Agent;
}, input: {
    request: API.Link;
    expiration: API.UTCUnixTimestamp;
    audience?: `did:${string}:${string}` | undefined;
    provider?: `did:web:${string}` | undefined;
}): {
    model: {
        agent: Agent.Agent<import("@web3-storage/access/types").Service>;
        audience: `did:${string}:${string}`;
        provider: `did:web:${string}`;
        expiration: number;
        request: Agent.Link<unknown, number, number, 1>;
    };
    readonly agent: Agent.Agent<import("@web3-storage/access/types").Service>;
    readonly audience: `did:${string}:${string}`;
    readonly expiration: Date;
    readonly request: Agent.Link<any, number, number, 1>;
    readonly provider: `did:web:${string}`;
    poll(): Promise<Agent.Result<API.Delegation<Agent.Capabilities>[], Agent.InvocationError | Agent.AccessClaimFailure | {
        model: {
            agent: Agent.Agent<import("@web3-storage/access/types").Service>;
            audience: `did:${string}:${string}`;
            provider: `did:web:${string}`;
            expiration: number;
            request: Agent.Link<any, number, number, 1>;
        };
        readonly name: string;
        readonly request: Agent.Link<any, number, number, 1>;
        readonly expiredAt: Date;
        describe(): string;
        readonly message: string;
        toJSON(): {
            name: string;
            message: string;
            stack: string | undefined;
        };
        stack?: string | undefined;
        cause?: unknown;
    }>>;
    claim({ signal, interval }?: {
        interval?: number | undefined;
        signal?: AbortSignal | undefined;
    } | undefined): Promise<Agent.Result<Agent.Access.GrantedAccess, Error>>;
};
export function delegate({ agent }: {
    agent: API.Agent;
}, input: {
    delegations: API.Delegation[];
    space?: `did:key:${string}` | undefined;
    proofs?: API.Delegation<Agent.Capabilities>[] | undefined;
}): Promise<{
    error: Agent.Failure;
    ok?: undefined;
} | Agent.Result<Agent.Unit, Agent.HandlerNotFound | Agent.HandlerExecutionError | Agent.InvalidAudience | Agent.Unauthorized | Agent.AccessDelegateFailure>>;
export const spaceAccess: {
    'space/*': {};
    'blob/*': {};
    'index/*': {};
    'store/*': {};
    'upload/*': {};
    'access/*': {};
    'filecoin/*': {};
    'usage/*': {};
};
export const accountAccess: {
    '*': {};
};
import * as DIDMailto from '@web3-storage/did-mailto';
import { Base } from '../base.js';
import * as Agent from '@web3-storage/access/agent';
import * as API from '../types.js';
//# sourceMappingURL=access.d.ts.map