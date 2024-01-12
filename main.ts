// @deno-types="https://cdn.esm.sh/v83/firebase@10.7.1/app/dist/app/index.d.ts"
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
// @deno-types="https://cdn.esm.sh/v83/firebase@10.7.1/firestore/dist/firestore/index.d.ts"
import { getFirestore, getDocs, setDoc, query, collectionGroup, collection, limit, where, WhereFilterOp, getAggregateFromServer, getCountFromServer, aggregateFieldEqual, aggregateQuerySnapshotEqual } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
// @deno-types="https://cdn.esm.sh/v83/firebase@10.7.1/firestore/dist/auth/index.d.ts"
import { getAuth, signInWithCredential, signInWithCustomToken, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js"
import * as log from "https://deno.land/std@0.211.0/log/mod.ts";
import { parse } from "https://deno.land/std@0.200.0/flags/mod.ts";
import { QueryConstraint } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";


log.setup({
  handlers: {
    console: new log.handlers.ConsoleHandler("DEBUG", {
      useColors: true,
    }),
    file: new log.handlers.FileHandler("INFO", {
      formatter: log.formatters.jsonFormatter,
      filename: "cli.log"
    }),
  },
  loggers: {
    default: {
      handlers: ["console", "file"],
      level: "NOTSET"
    }
  }
});
function parseConstraints(raw: string): QueryConstraint[] {
  const groups = raw.split(" && ")

  return groups.map((group) => {
    const ops = group.split(" ")
    return where(ops[0], ops[1] as WhereFilterOp, ops[2])
  })
}

const flags = parse(Deno.args, {
  boolean: ["get", "set"],
  string: ["config", "email", "password", "collection", "limit", "constraints"],
  default: { config: "firebase.json", get: true, collection: "users", set: false }
})

const limitOrNull = flags.limit ? parseInt(flags.limit) : null

const app = initializeApp(JSON.parse(Deno.readTextFileSync(flags.config)));
const firestore = getFirestore(app);
const auth = getAuth(app);


if(flags.email && flags.password) {
  await signInWithEmailAndPassword(auth, flags.email, flags.password);
}

const constraints: QueryConstraint[] = []
if(limitOrNull) constraints.push(limit(limitOrNull))
if(flags.constraints) {
  constraints.push(...parseConstraints(flags.constraints))
}
// constraints.push(where("userInfo.fullName.nickname", "==", "Plaito"))
const coll = collection(
  firestore,
  flags.collection
)

const docs = (await getDocs(
  query(
    coll, ...constraints
  )
)).docs.map((d) => d.data())
console.log(JSON.stringify(docs, null, 2))
Deno.exit(0)